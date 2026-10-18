import { Card } from '../ui/card';
import { Dot } from './icons';
import { API_BASE_URL, type HealthResponse } from '../../lib/api-client';
import { relativeTime, sensorLabel, type SensorRow } from '../../lib/telemetry';
export function SystemPanel({ rows, apiState, health, now, lastPoll, latestTimestamp, errors }: {
  rows: SensorRow[]; apiState: string; health: HealthResponse | null; now: number; lastPoll?: number; latestTimestamp?: number; errors: Record<string,string>
}) {
  const issues = rows.filter(r => r.status !== 'Normal');
  return <div className="system-panel">
    <Card className="system-card"><h3>Connection & acquisition</h3><dl>
      <div><dt>API</dt><dd><Dot tone={apiState === 'connected' ? 'normal' : 'danger'}/>{apiState}</dd></div>
      <div><dt>Emulator health</dt><dd>{health ? health.emulator ? 'Reachable' : 'Unavailable' : 'Unknown'}</dd></div>
      <div><dt>API endpoint</dt><dd className="endpoint">{API_BASE_URL}</dd></div>
      <div><dt>Latest reading</dt><dd>{relativeTime(latestTimestamp,now)}</dd></div>
      <div><dt>Last successful poll</dt><dd>{relativeTime(lastPoll === undefined ? undefined : lastPoll/1000,now)}</dd></div>
      <div><dt>Telemetry polling</dt><dd>1 second after each request</dd></div>
      <div><dt>Stale threshold</dt><dd>5 seconds</dd></div>
      <div><dt>History window</dt><dd>60 seconds in this browser</dd></div>
    </dl><p className="system-note">Emulator health checks metadata availability. Live stream activity is inferred from the latest reading timestamp.</p></Card>
    <Card className="system-card"><h3>Sensor issues <span className="issue-count">{issues.length}</span></h3>
      {Object.entries(errors).map(([key,value]) => <p key={key} className="system-error">{key}: {value}</p>)}
      {!issues.length && <p className="system-note">All reporting sensors are operating within their valid ranges.</p>}
      <div className="issue-list">{issues.map(row => <div key={row.sensorId}><Dot tone={row.status === 'Stale' ? 'stale' : row.status === 'Out of range' ? 'danger' : 'muted'}/><span>{sensorLabel(row.sensorName)}</span><strong>{row.status}</strong><small>{relativeTime(row.reading?.timestamp,now)}</small></div>)}</div>
    </Card>
  </div>;
}
