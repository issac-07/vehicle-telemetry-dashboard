import http from 'http';
import express from 'express';
import cors from 'cors';

import {
  connectTelemetryStream,
  getLatestReadings
} from './telemetry';

const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

// Default to local emulator when EMULATOR_URL is not provided.
const EMULATOR_URL = process.env.EMULATOR_URL || 'http://localhost:3001';
void connectTelemetryStream(EMULATOR_URL);

app.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${EMULATOR_URL.replace(/\/$/, '')}/sensors`);
    if (r.ok) {
      return res.json({ status: 'ok', emulator: true });
    }
  } catch {
    // connection failed
  }
  res.status(503).json({ status: 'unhealthy', emulator: false });
});

app.get('/sensors', async (_req, res) => {
  try {
    const response = await fetch(
      `${EMULATOR_URL.replace(/\/$/, '')}/sensors`
    );

    if (!response.ok) {
      return res.status(502).json({
        error: 'Failed to fetch sensor metadata from emulator'
      });
    }

    const sensors = await response.json();

    return res.json(sensors);
  } catch (error) {
    console.error('Failed to fetch sensors:', error);

    return res.status(503).json({
      error: 'Emulator unavailable'
    });
  }
});

app.get('/telemetry', (_req, res) => {
  return res.json(getLatestReadings());
});

// ---------------------------------------------------------------------------
// Assessment: implement the API below.
// The emulator is a black box: it only outputs data. Its base URL is EMULATOR_URL
// (e.g. http://emulator:3001 with Docker, or http://localhost:3001 locally).
// Emulator exposes only:
//   GET {EMULATOR_URL}/sensors   → static metadata (sensorId, sensorName, unit)
//   WS  {EMULATOR_URL}/ws/telemetry → stream of readings { sensorId, value, timestamp }
// The emulator does not store or serve "latest" readings. You must:
// - Connect to the emulator WebSocket stream.
// - Store the latest value per sensor in the API as readings arrive.
// - Expose your own metadata and "latest telemetry" routes to clients.
// Do not modify the emulator service.
// ---------------------------------------------------------------------------

const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(Number(PORT), HOST, () => {
  console.log(`API server listening on http://${HOST}:${PORT}`);
});
