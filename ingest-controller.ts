
// ingest-controller.ts (Aggregated)
import type { Request, Response } from 'express';
// import { db } from './src/lib/firebase-admin'; // Moved to service
// import * as admin from 'firebase-admin';       // Moved to service
import { processIncidentReport, IncidentInput } from './src/services/incident-service';


export const ingestData = async (req: Request, res: Response) => {
  try {
    const { text, photoDataUri, authorType } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const input: IncidentInput = {
      text,
      sourceType: 'manual', // or derived from headers
      authorType: authorType || 'unverified',
      evidence: photoDataUri ? { image: photoDataUri } : undefined
    };

    const result = await processIncidentReport(input);

    return res.status(200).json({
      message: 'Report processed',
      result
    });

  } catch (error) {
    console.error('Error processing ingestion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
