import EventEmitter from 'events';
import sensorConfig from './sensor-config.json';

export interface SensorConfig {
  busNumber: number;
  frameId: number;
  signalIndex: number;
  sensorName: string;
  unit: string;
  minValue: number;
  maxValue: number;
  intervalMs: number; // fixed interval between samples for this sensor
}

export interface TelemetryReading {
  sensorId: number;
  value: number;
  timestamp: number; // unix seconds
}

export const telemetryEmitter = new EventEmitter();

const sensors: SensorConfig[] = sensorConfig;

export function computeSensorId(sensor: SensorConfig): number {
  let uniqueId = sensor.busNumber;
  uniqueId = uniqueId * 10_000_000_000 + sensor.frameId;
  uniqueId = uniqueId * 100 + sensor.signalIndex;
  return uniqueId;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomUnparseableString(): string {
  const patterns: Array<() => string> = [
    // Looks numeric at a glance but is not a valid number
    () => `NaNish${Math.floor(Math.random() * 1000)}`,
    // Digits with a non-numeric character in the middle
    () =>
      `${Math.floor(Math.random() * 1000)}X${Math.floor(Math.random() * 1000)}`,
    // Random base-36 chunk, usually alphanumeric
    () => Math.random().toString(36).slice(2, 8).toUpperCase()
  ];
  const pick = patterns[Math.floor(Math.random() * patterns.length)];
  return pick();
}

// With this probability the emulator sends a reading in an incorrect format (for assessment).
// Within the invalid readings, there is a 50/50 split between recoverable vs drop-worthy errors.
const INVALID_FORMAT_PROBABILITY = 0.15;
// With this probability the emulator sends a value outside the sensor's valid range (overspill).
const OVERSPILL_PROBABILITY = 0.20;

function scheduleSensor(sensor: SensorConfig): void {
  const interval = Math.max(50, sensor.intervalMs);
  setTimeout(() => {
    const sensorId = computeSensorId(sensor);
    let value: number;
    if (Math.random() < OVERSPILL_PROBABILITY) {
      // Overspill: emit a value outside [minValue, maxValue] so the API can detect out-of-range.
      const span = sensor.maxValue - sensor.minValue;
      value = Math.random() < 0.5
        ? sensor.minValue - span * (0.1 + Math.random() * 0.5)
        : sensor.maxValue + span * (0.1 + Math.random() * 0.5);
    } else {
      value = randomInRange(sensor.minValue, sensor.maxValue);
    }
    const timestamp = Date.now() / 1000;

    if (Math.random() < INVALID_FORMAT_PROBABILITY) {
      // Emit an invalid payload so the API must validate and decide whether to fix or drop it.
      // Use a single sub-roll to split evenly across four cases (2 recoverable, 2 drop-worthy).
      const sub = Math.random();
      let payload: unknown;

      if (sub < 0.25) {
        // RECOVERABLE: sensorId as numeric string
        payload = { sensorId: String(sensorId), value, timestamp };
        console.log('[emulator] invalid-recoverable', JSON.stringify(payload));
      } else if (sub < 0.5) {
        // RECOVERABLE: value as numeric string
        payload = { sensorId, value: value.toFixed(3), timestamp };
        console.log('[emulator] invalid-recoverable', JSON.stringify(payload));
      } else if (sub < 0.75) {
        // DROP-WORTHY: non-numeric value that cannot be parsed cleanly
        payload = { sensorId, value: randomUnparseableString(), timestamp };
        console.log('[emulator] invalid-drop', JSON.stringify(payload));
      } else {
        // DROP-WORTHY: missing sensorId
        payload = { value, timestamp };
        console.log('[emulator] invalid-drop', JSON.stringify(payload));
      }

      telemetryEmitter.emit('reading', payload);
    } else {
      const reading: TelemetryReading = { sensorId, value, timestamp };
      // Log normal readings (including overspill) for visibility even without WebSocket clients.
      console.log('[emulator] reading', JSON.stringify(reading));
      telemetryEmitter.emit('reading', reading);
    }

    scheduleSensor(sensor);
  }, interval);
}

export function startEmulator(): void {
  sensors.forEach((sensor) => scheduleSensor(sensor));
}

export function getSensorConfigs(): SensorConfig[] {
  return sensors;
}

