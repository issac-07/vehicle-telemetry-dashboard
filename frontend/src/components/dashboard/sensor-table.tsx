'use client';
import { useState } from 'react';
import { SensorIcon, Dot } from './icons';
import { StatusBadge, statusTone } from './metric-card';
import { displayUnit, relativeTime, sensorLabel, type SensorRow, type SensorStatus } from '../../lib/telemetry';
export function SensorTable({ rows, now }: { rows: SensorRow[]; now: number }) {
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState<'default' | 'name' | 'updated'>('default');
  const filtered = rows.filter(r => filter === 'All' || r.status === filter).sort((a,b) => sort === 'name' ? sensorLabel(a.sensorName).localeCompare(sensorLabel(b.sensorName)) : sort === 'updated' ? (b.reading?.timestamp ?? 0)-(a.reading?.timestamp ?? 0) : 0);
  return <div className="sensor-registry">
    <div className="filter-bar"><span className="registry-caption">SENSOR REGISTRY</span><label className="status-select">Status <select aria-label="Filter sensors by status" value={filter} onChange={e => setFilter(e.target.value)}>{['All','Normal','Out of range','Stale','No data'].map(s => <option key={s}>{s}</option>)}</select></label></div>
    <div className="table-scroll"><table><thead><tr>
      <th><button onClick={() => setSort(sort === 'name' ? 'default' : 'name')}>Name <span aria-hidden="true">{sort === 'name' ? '↑' : '↕'}</span></button></th>
      <th>Value</th><th>Unit</th><th>Status</th><th><button onClick={() => setSort(sort === 'updated' ? 'default' : 'updated')}>Updated <span aria-hidden="true">↓</span></button></th>
    </tr></thead><tbody>{filtered.map(row => <tr key={row.sensorId} title={`Sensor ID: ${row.sensorId}${row.status === 'Stale' && row.outOfRange ? ' · Last value is also out of range' : ''}`}>
      <td><span className="sensor-name"><SensorIcon name={row.sensorName}/>{sensorLabel(row.sensorName)}</span></td>
      <td className={row.outOfRange ? 'value-danger' : ''}>{row.reading?.value.toFixed(1) ?? '—'}</td>
      <td>{displayUnit(row.unit)}</td><td><span className="table-status"><Dot tone={statusTone(row.status)}/><StatusBadge status={row.status}/></span></td>
      <td className={row.status === 'Stale' ? 'value-stale' : ''}>{relativeTime(row.reading?.timestamp, now)}</td>
    </tr>)}</tbody></table>{!filtered.length && <div className="empty-state">No sensors match this view.</div>}</div>
  </div>;
}
