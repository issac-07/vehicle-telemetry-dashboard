import { Card } from '../ui/card';
import { SensorIcon } from './icons';
import { displayUnit, relativeTime, sensorLabel, SENSOR_RANGES, type SensorRow, type SensorStatus } from '../../lib/telemetry';
export function statusTone(status: SensorStatus) {
  return status === 'Normal' ? 'normal' : status === 'Out of range' ? 'danger' : status === 'Stale' ? 'stale' : 'muted';
}
export function StatusBadge({ status }: { status: SensorStatus }) { return <span className={`status-badge tone-${statusTone(status)}`}>{status}</span>; }
export function MetricCard({ name, sensor, now, compact = false, label }: { name: string; sensor?: SensorRow; now: number; compact?: boolean; label?: string }) {
  const range = SENSOR_RANGES[name];
  return <Card className={`metric-card ${compact ? 'compact' : ''}`}>
    <SensorIcon name={name} />
    <div className="metric-body"><div className="metric-heading"><h2>{label ?? sensorLabel(name)}</h2><StatusBadge status={sensor?.status ?? 'No data'} /></div>
      <div className={`metric-value ${sensor?.outOfRange ? 'value-danger' : ''}`}>{sensor?.reading?.value.toFixed(1) ?? '—'}<span>{displayUnit(sensor?.unit)}</span></div>
      <div className="metric-foot">{name === 'BATTERY_TEMPERATURE' && range && <span>Valid range: {range.min} – {range.max} {displayUnit(sensor?.unit)}</span>}<span>{sensor?.reading ? `Updated ${relativeTime(sensor.reading.timestamp, now)}` : 'Waiting for data'}</span></div>
    </div>
  </Card>;
}
