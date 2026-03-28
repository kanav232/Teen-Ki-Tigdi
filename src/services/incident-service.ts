
import * as admin from 'firebase-admin';
import { db } from '../../firebase-admin';
import { Incident, ValidationMetrics } from '../lib/types';
import { calculateConfidence } from '../lib/calculate-confidence';
import { getCoordinates } from '../ai/flows/extract-location-from-text';
import { generateEmergencyTicketSummary } from '../ai/flows/generate-emergency-ticket-summary';
import { calculateDistance } from '../lib/geo-utils';


export type IncidentInput = {
    text: string;
    sourceType: 'twitter' | 'bluesky' | 'whatsapp' | 'manual';
    authorId?: string;
    authorType?: 'verified' | 'unverified'; // relevant for confidence
    evidence?: {
        image?: string; // Still accepted but not processed via AI for now
        video?: string;
    };
    locationOverride?: string; // if we already know the location
    postUri?: string; // Unique URI for deduplication
    postUrl?: string; // Web link to the post
};


export async function processIncidentReport(input: IncidentInput) {
    console.log(`[IncidentService] Processing report: "${input.text.substring(0, 30)}..."`);

    // 0. Early Deduplication Check (SAVE LLM QUOTA)
    if (input.postUri) {
        // Check if ANY incident already has this URI in its relatedPostUris array
        const duplicateSnapshot = await db.collection('incidents')
            .where('relatedPostUris', 'array-contains', input.postUri)
            .get();

        if (!duplicateSnapshot.empty) {
            console.log(`[IncidentService] Duplicate post detected (${input.postUri}). Skipping AI processing.`);
            return { status: 'duplicate', id: duplicateSnapshot.docs[0].id };
        }
    }


    // 1. Classify Intent
    // OPTIMIZATION: User requested to trust keywords and skip generic AI classification.
    // We assume if it matched the poller keywords, it IS relevant.
    const classification = {
        isEmergency: true,
        severity: 'moderate', // Default for keyword-matched posts
        reason: 'Keyword match (AI classification skipped)'
    };

    if (!classification.isEmergency) {
        console.log('[IncidentService] Message flagged as non-emergency/low-severity by AI.');
        // return { status: 'ignored', reason: 'Not an emergency' }; 
    }

    // 2. Extract Location
    let locationName = input.locationOverride;
    let extractedLocResult: any = null;

    if (!locationName) {
        // ALWAYS use the precise Geocoding API to extract exact mapped coordinates
        extractedLocResult = await getCoordinates(input.text);
        locationName = extractedLocResult.location;
    }

    if (!locationName || locationName === 'Unknown Location') {
        console.log('[IncidentService] Could not extract location name. Will try one more time if creating new.');
    }

    // 3. Evidence Validation (Skipped per user request)
    let evidenceValidation = null;



    // 4.2 Aggregation Check (Geospatial + Semantic)
    let type: Incident['type'] = 'Public Alert'; // Default
    const severity: Incident['severity'] = (classification.severity as Incident['severity']) || 'moderate';

    const lower = input.text.toLowerCase();
    
    // Categorize incident based on text keywords
    if (lower.includes('fire') || lower.includes('blaze') || lower.includes('smoke')) type = 'Fire';
    else if (lower.includes('accident') || lower.includes('crash') || lower.includes('hit and run')) type = 'Accident';
    else if (lower.includes('traffic') || lower.includes('jam') || lower.includes('blocked')) type = 'Congestion';
    else if (lower.includes('pothole') || lower.includes('pot hole') || lower.includes('crater') || lower.includes('road broken') || lower.includes('road caved')) type = 'Pothole';
    else if (lower.includes('waterlog') || lower.includes('flood') || lower.includes('drain')) type = 'Waterlogging';
    else if (lower.includes('wire') || lower.includes('pole') || lower.includes('electric') || lower.includes('transformer')) type = 'Electrical Hazard';
    else if (lower.includes('animal') || lower.includes('dog') || lower.includes('cattle')) type = 'Animal Menace';
    else if (lower.includes('collapse') || lower.includes('structure') || lower.includes('building')) type = 'Infrastructure Hazard';

    // Fetch active incidents to check proximity
    const snapshot = await db.collection('incidents')
        .where('status', 'in', ['new', 'acknowledged', 'in-progress'])
        .get();

    let existingDoc: any = null;
    let existingData: Incident | null = null;

    if (extractedLocResult?.coordinates) {
        for (const doc of snapshot.docs) {
            const data = doc.data() as Incident;

            // Check distance (200m range)
            const distance = calculateDistance(
                extractedLocResult.coordinates.lat,
                extractedLocResult.coordinates.lng,
                data.coordinates.lat,
                data.coordinates.lng
            );

            if (distance <= 200 && data.type === type) {
                console.log(`[IncidentService] Proximity & Type match! (${Math.round(distance)}m). Automatically merging as requested.`);
                existingDoc = doc;
                existingData = data;
                break;
            }
        }
    }

    const timestamp = new Date().toISOString();

    if (existingDoc && existingData) {
        // --- UPDATE EXISTING ---
        console.log(`[IncidentService] Aggregating with existing INC: ${existingDoc.id}`);

        const newMetrics: ValidationMetrics = {
            postCount: (existingData.validationMetrics?.postCount || 0) + 1,
            verifiedPostCount: (existingData.validationMetrics?.verifiedPostCount || 0) + (input.authorType === 'verified' ? 1 : 0),
            relevantMediaCount: (existingData.validationMetrics?.relevantMediaCount || 0) // No new media validation for now
        };

        const newConfidence = calculateConfidence({
            baseSeverity: existingData.severity,
            metrics: newMetrics
        });

        // Update fields
        const updateData: any = {
            posts: admin.firestore.FieldValue.arrayUnion({ text: input.text, url: input.postUrl }),
            validationMetrics: newMetrics,
            confidence: Math.round(newConfidence * 100),
            timestamp: timestamp // bump activity
        };

        if (input.postUri) {
            updateData.relatedPostUris = admin.firestore.FieldValue.arrayUnion(input.postUri);
        }

        await existingDoc.ref.update(updateData);

        return { status: 'aggregated', id: existingDoc.id };

    } else {
        // --- CREATE NEW ---
        console.log(`[IncidentService] Creating NEW Incident`);

        // Strict Location Check & Geocoding
        // Optimization: Use previous result if available, otherwise call once
        const locResult = extractedLocResult || await getCoordinates(locationName || input.text);

        if (!locResult.location || locResult.location === 'Unknown Location' || !locResult.coordinates) {
            console.log('[IncidentService] Could not extract specific location/coordinates. Skipping (Strict Mode).');
            return { status: 'ignored', reason: 'No location/coordinates found' };
        }

        // Use the refined location name from the result
        locationName = locResult.location;

        const metrics: ValidationMetrics = {
            postCount: 1,
            verifiedPostCount: input.authorType === 'verified' ? 1 : 0,
            relevantMediaCount: 0 // No media validation for now
        };

        const confidence = calculateConfidence({
            baseSeverity: severity,
            metrics: metrics
        });

        const summaryResult = await generateEmergencyTicketSummary({
            incidentType: type,
            severityLevel: severity,
            gpsCoordinates: `${locResult.coordinates.lat}, ${locResult.coordinates.lng}`,
            aiConfidenceScore: confidence,
            supportingPosts: [input.text],
            sourceUrl: input.postUrl
        });

        const newIncident: Incident = {
            id: `INC-${Date.now()}`, // temp ID
            type: type,
            severity: severity,
            location: locationName || 'Unknown Location',
            coordinates: locResult.coordinates, // Guaranteed by check above
            timestamp: timestamp,
            confidence: Math.round(confidence * 100),
            status: 'new',
            summary: summaryResult.summary,
            posts: [{ text: input.text, url: input.postUrl }],
            validationMetrics: metrics,
            relatedPostUris: input.postUri ? [input.postUri] : [],
            url: input.postUrl
        };

        const res = await db.collection('incidents').add(newIncident);

        return { status: 'created', id: res.id };
    }
}
