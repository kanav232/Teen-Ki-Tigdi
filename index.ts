/// <reference types="node" />
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { incidentRouter } from './incidents';
import { authRouter } from './auth';
import { ingestRouter } from './ingest';
import { startBlueskyPoller } from './src/services/bluesky-poller';

const app = express();
const PORT = process.env.PORT || 3001;

// Start Background Services
startBlueskyPoller(); // Verified Bluesky Integration

app.use(cors());
app.use(express.json());

app.use('/api/incidents', incidentRouter);
app.use('/api/auth', authRouter);
app.use('/api/ingest', ingestRouter);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (e: any) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n🚨 CRITICAL ERROR: PORT ${PORT} IS ALREADY IN USE! 🚨`);
    console.error(`You have another hidden VSCode terminal tab running this exact server in the background! Please close it or click the Trash Can on your other terminal tabs! Shutting down to prevent database duplication...`);
    process.exit(1);
  } else {
    console.error('Server error:', e);
  }
});