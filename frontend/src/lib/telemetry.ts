import type { SensorMetadata, TelemetryReading } from './api-client';

export const STALE_AFTER_MS = 5000;
export const HISTORY_MS = 60000;
export const SENSOR_RANGES: Record<string, { min: number; max: number }> = {
  BATTERY_TEMPERATURE: { min: 20, max: 80 }, MOTOR_TEMPERATURE: { min: 30, max: 120 },
  TYRE_PRESSURE_FL: { min: 150, max: 250 }, TYRE_PRESSURE_FR: { min: 150, max: 250 },
  TYRE_PRESSURE_RL: { min: 150, max: 250 }, TYRE_PRESSURE_RR: { min: 150, max: 250 },
  PACK_CURRENT: { min: -300, max: 300 }, PACK_VOLTAGE: { min: 350, max: 500 },
  PACK_SOC: { min: 0, max: 100 }, VEHICLE_SPEED: { min: 0, max: 250 },
  STEERING_ANGLE: { min: -180, max: 180 }, BRAKE_PRESSURE_FRONT: { min: 0, max: 120 }
};
export const SENSOR_ORDER = ['VEHICLE_SPEED', 'BATTERY_TEMPERATURE', 'MOTOR_TEMPERATURE',
  'TYRE_PRESSURE_FL', 'TYRE_PRESSURE_FR', 'TYRE_PRESSURE_RL', 'TYRE_PRESSURE_RR',
  'PACK_CURRENT', 'PACK_VOLTAGE', 'PACK_SOC', 'STEERING_ANGLE', 'BRAKE_PRESSURE_FRONT'];
const LABELS: Record<string, string> = {
  VEHICLE_SPEED: 'Vehicle Speed', BATTERY_TEMPERATURE: 'Battery Temperature', MOTOR_TEMPERATURE: 'Motor Temperature',
  TYRE_PRESSURE_FL: 'Tyre Pressure FL', TYRE_PRESSURE_FR: 'Tyre Pressure FR',
  TYRE_PRESSURE_RL: 'Tyre Pressure RL', TYRE_PRESSURE_RR: 'Tyre Pressure RR',
  PACK_CURRENT: 'Pack Current', PACK_VOLTAGE: 'Pack Voltage', PACK_SOC: 'Pack State of Charge',
  STEERING_ANGLE: 'Steering Angle', BRAKE_PRESSURE_FRONT: 'Front Brake Pressure'
};
export type SensorStatus = 'Normal' | 'Out of range' | 'Stale' | 'No data' | 'Unknown';
export type SensorRow = SensorMetadata & { reading?: TelemetryReading; status: SensorStatus; outOfRange: boolean };
export type History = Record<number, TelemetryReading[]>;
export function sensorLabel(name: string) { return LABELS[name] ?? name.replaceAll('_', ' '); }
export function displayUnit(unit?: string) { return unit === 'C' ? '°C' : unit ?? ''; }
export function relativeTime(timestamp: number | undefined, now: number) {
  if (timestamp === undefined) return 'No data yet';
  const seconds = Math.max(0, (now - timestamp * 1000) / 1000);
  if (seconds < 1) return '<1 s ago';
  if (seconds < 60) return `${Math.floor(seconds)} s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s ago`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ago`;
}
export function buildSensorRows(sensors: SensorMetadata[], readings: TelemetryReading[], now: number): SensorRow[] {
  const byId = new Map(readings.map(r => [r.sensorId, r]));
  return sensors.map(sensor => {
    const reading = byId.get(sensor.sensorId);
    const range = SENSOR_RANGES[sensor.sensorName];
    const outOfRange = !!(reading && range && (reading.value < range.min || reading.value > range.max));
    const status: SensorStatus = !reading ? 'No data' : now - reading.timestamp * 1000 >= STALE_AFTER_MS
      ? 'Stale' : outOfRange ? 'Out of range' : range ? 'Normal' : 'Unknown';
    return { ...sensor, reading, status, outOfRange };
  }).sort((a, b) => {
    const index = (name: string) => { const i = SENSOR_ORDER.indexOf(name); return i < 0 ? 999 : i; };
    return index(a.sensorName) - index(b.sensorName);
  });
}
// Keep actual sampled readings only. Old data and repeated latest timestamps are not appended.
export function appendHistory(previous: History, readings: TelemetryReading[], now: number): History {
  const next: History = {};
  for (const [id, points] of Object.entries(previous)) next[Number(id)] = points.filter(p => p.timestamp * 1000 >= now - HISTORY_MS).slice(-120);
  for (const reading of readings) {
    const points = next[reading.sensorId] ?? [];
    if (reading.timestamp * 1000 < now - HISTORY_MS || reading.timestamp * 1000 > now + 1000) continue;
    if (!points.length || reading.timestamp > points[points.length - 1].timestamp) next[reading.sensorId] = [...points, reading].slice(-120);
  }
  return next;
}
