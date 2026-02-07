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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});