'use client';
import { useEffect, useState } from 'react';
import { fetchHealth, fetchSensors, fetchTelemetry, type SensorMetadata, type TelemetryReading, type HealthResponse } from '../lib/api-client';
import { appendHistory, buildSensorRows, type History } from '../lib/telemetry';
export function useTelemetry() {
  const [sensors, setSensors] = useState<SensorMetadata[]>([]);
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [history, setHistory] = useState<History>({});
  const [now, setNow] = useState(0);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [apiState, setApiState] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastPoll, setLastPoll] = useState<number>();
  useEffect(() => {
    const controller = new AbortController();
    let stopped = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const schedule = (task: () => void, delay: number) => {
      const timer = setTimeout(() => { timers.delete(timer); if (!stopped) task(); }, delay);
      timers.add(timer);
    };
    const error = (key: string, value?: unknown) => setErrors(previous => {
      const next = { ...previous };
      if (value) next[key] = value instanceof Error ? value.message : 'Request failed'; else delete next[key];
      return next;
    });
    const pollHealth = async () => {
      try { const data = await fetchHealth(3000, controller.signal); if (stopped) return; setHealth(data); setApiState('connected'); error('health'); }
      catch (e) { if (stopped) return; setApiState('offline'); setHealth(null); error('health', e); }
      schedule(pollHealth, 5000);
    };
    const loadMetadata = async () => {
      try { const data = await fetchSensors(controller.signal); if (stopped) return; setSensors(data); error('metadata'); if (!data.length) schedule(loadMetadata, 3000); }
      catch (e) { if (stopped) return; error('metadata', e); schedule(loadMetadata, 3000); }
    };
    const pollReadings = async () => {
      try {
        const data = await fetchTelemetry(controller.signal);
        if (stopped) return;
        const receivedAt = Date.now();
        setReadings(data); setLastPoll(receivedAt); setHistory(previous => appendHistory(previous, data, receivedAt)); error('telemetry');
      } catch (e) { if (stopped) return; error('telemetry', e); }
      schedule(pollReadings, 1000);
    };
    setNow(Date.now());
    const clock = setInterval(() => setNow(Date.now()), 500);
    void pollHealth(); void loadMetadata(); void pollReadings();
    return () => { stopped = true; controller.abort(); clearInterval(clock); timers.forEach(clearTimeout); };
  }, []);
  const rows = buildSensorRows(sensors, readings, now);
  const latestTimestamp = readings.length ? Math.max(...readings.map(r => r.timestamp)) : undefined;
  return { rows, history, now, health, apiState, errors, lastPoll, latestTimestamp, loading: !sensors.length && !errors.metadata };
}
