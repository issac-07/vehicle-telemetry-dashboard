export interface SensorMetadata { sensorId: number; sensorName: string; unit: string; }
export interface TelemetryReading { sensorId: number; value: number; timestamp: number; }
export interface HealthResponse { status: string; emulator?: boolean; reason?: string; }
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
async function request<T>(path: string, timeoutMs = 4000, signal?: AbortSignal, allowUnhealthy = false): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { signal: controller.signal, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok && !(allowUnhealthy && response.status === 503 && data.status === 'unhealthy')) throw new Error(data.error ?? data.reason ?? `Request failed (${response.status})`);
    return data as T;
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
export function fetchHealth(timeoutMs = 3000, signal?: AbortSignal) { return request<HealthResponse>('/health', timeoutMs, signal, true); }
export function fetchSensors(signal?: AbortSignal) { return request<SensorMetadata[]>('/sensors', 4000, signal); }
export function fetchTelemetry(signal?: AbortSignal) { return request<TelemetryReading[]>('/telemetry', 4000, signal); }
