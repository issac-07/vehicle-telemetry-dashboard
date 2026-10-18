import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import {
  startEmulator,
  telemetryEmitter,
  getSensorConfigs,
  computeSensorId
} from './index';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Static config only: sensorId, sensorName, unit (no min/max). No storage of readings.
app.get('/sensors', (_req, res) => {
  const configs = getSensorConfigs().map((sensor) => ({
    sensorId: computeSensorId(sensor),
    sensorName: sensor.sensorName,
    unit: sensor.unit
  }));
  res.json(configs);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/telemetry' });

wss.on('connection', (ws) => {
  const handler = (payload: unknown) => {
    // Log every payload the emulator produces for visibility during development.
    console.log('[emulator] payload', JSON.stringify(payload));
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };
  telemetryEmitter.on('reading', handler);
  ws.on('close', () => telemetryEmitter.off('reading', handler));
});

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  startEmulator();
  console.log(`Emulator listening on http://${HOST}:${PORT}`);
});
