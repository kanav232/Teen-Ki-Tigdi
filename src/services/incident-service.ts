
import * as admin from 'firebase-admin';
import { db } from '../../firebase-admin';
import { Incident, ValidationMetrics } from '../lib/types';
import { calculateConfidence } from '../lib/calculate-confidence';
import { getCoordinates } from '../ai/flows/extract-location-from-text';
import { classifyEmergencyIntent } from '../ai/flows/classify-emergency-intent';
import { validateVisualEvidence } from '../ai/flows/validate-visual-evidence';
import { generateEmergencyTicketSummary } from '../ai/flows/generate-emergency-ticket-summary';


export type IncidentInput = {
    text: string;
    sourceType: 'twitter' | 'bluesky' | 'whatsapp' | 'manual';
    authorId?: string;
    authorType?: 'verified' | 'unverified'; // relevant for confidence
    evidence?: {
        image?: string; // base64 or url
        video?: string;
    };
    locationOverride?: string; // if we already know the location
    postUri?: string; // Unique URI for deduplication
    postUrl?: string; // Web link to the post
};


export async function processIncidentReport(input: IncidentInput) {
    console.log(`[IncidentService] Processing report: "${input.text.substring(0, 30)}..."`);

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
    // We will ensure valid coordinates in the creation block if needed

    if (!locationName) {
        const locResult = await getCoordinates(input.text);
        locationName = locResult.location;
    }

    if (!locationName || locationName === 'Unknown Location') {
        console.log('[IncidentService] Could not extract location name. Skipping search, will try deep extraction on creation.');
        // Don't return yet, give it a chance in the "else" block or fail there
    }

    // 3. Validate Evidence (if any)
    let evidenceValidation = null;
    if (input.evidence?.image) {
        evidenceValidation = await validateVisualEvidence({
            photoDataUri: input.evidence.image,
            description: input.text
        });
    }

    // 4.1 Deduplication Check
    if (input.postUri) {
        // Check if ANY incident already has this URI in its relatedPostUris array
        const duplicateSnapshot = await db.collection('incidents')
            .where('relatedPostUris', 'array-contains', input.postUri)
            .get();

        if (!duplicateSnapshot.empty) {
            console.log(`[IncidentService] Duplicate post detected (${input.postUri}). Skipping.`);
            return { status: 'duplicate', id: duplicateSnapshot.docs[0].id };
        }
    }


    // 4.2 Aggregation Check (Existing Incident)
    let type: Incident['type'] = 'Public Unrest';
    const severity: Incident['severity'] = (classification.severity as Incident['severity']) || 'minor';

    const lower = input.text.toLowerCase();
    if (lower.includes('fire')) type = 'Fire';
    else if (lower.includes('accident') || lower.includes('crash')) type = 'Accident';
    else if (lower.includes('traffic')) type = 'Congestion';

    const snapshot = await db.collection('incidents')
        .where('status', 'in', ['new', 'acknowledged', 'in-progress'])
        .where('type', '==', type)
        .get();

    let existingDoc: any = null;
    let existingData: Incident | null = null;

    // Manual fuzzy filter for MVP
    for (const doc of snapshot.docs) {
        const data = doc.data() as Incident;
        if (data.location === locationName) {
            existingDoc = doc;
            existingData = data;
        }
    }

    const timestamp = new Date().toISOString();

    if (existingDoc && existingData) {
        // --- UPDATE EXISTING ---
        console.log(`[IncidentService] Aggregating with existing INC: ${existingDoc.id}`);

        const newMetrics: ValidationMetrics = {
            postCount: (existingData.validationMetrics?.postCount || 0) + 1,
            verifiedPostCount: (existingData.validationMetrics?.verifiedPostCount || 0) + (input.authorType === 'verified' ? 1 : 0),
            relevantMediaCount: (existingData.validationMetrics?.relevantMediaCount || 0) + (evidenceValidation && evidenceValidation.confidenceScore > 0.7 ? 1 : 0)
        };

        const newConfidence = calculateConfidence({
            baseSeverity: existingData.severity,
            metrics: newMetrics
        });

        // Update fields
        const updateData: any = {
            posts: admin.firestore.FieldValue.arrayUnion(input.text),
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
        // We call getCoordinates again with the location name (or text) to ensure we have valid coords
        const locResult = await getCoordinates(locationName || input.text);

        if (!locResult.location || locResult.location === 'Unknown Location' || !locResult.coordinates) {
            console.log('[IncidentService] Could not extract specific location/coordinates. Skipping (Strict Mode).');
            return { status: 'ignored', reason: 'No location/coordinates found' };
        }

        // Use the refined location name from the result
        locationName = locResult.location;

        const metrics: ValidationMetrics = {
            postCount: 1,
            verifiedPostCount: input.authorType === 'verified' ? 1 : 0,
            relevantMediaCount: evidenceValidation && evidenceValidation.confidenceScore > 0.7 ? 1 : 0
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
            location: locationName,
            coordinates: locResult.coordinates, // Guaranteed by check above
            timestamp: timestamp,
            confidence: Math.round(confidence * 100),
            status: 'new',
            summary: summaryResult.summary,
            posts: [input.text],
            validationMetrics: metrics,
            relatedPostUris: input.postUri ? [input.postUri] : [],
            url: input.postUrl
        };

        const res = await db.collection('incidents').add(newIncident);

        return { status: 'created', id: res.id };
    }
}
