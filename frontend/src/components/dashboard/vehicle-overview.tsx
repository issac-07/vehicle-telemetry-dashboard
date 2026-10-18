import { Card } from '../ui/card';
import { StatusBadge } from './metric-card';
import { relativeTime, type SensorRow } from '../../lib/telemetry';
const wheels = [
  { code: 'FL', title: 'Front Left Tyre Pressure', position: 'front left' },
  { code: 'FR', title: 'Front Right Tyre Pressure', position: 'front right' },
  { code: 'RL', title: 'Rear Left Tyre Pressure', position: 'rear left' },
  { code: 'RR', title: 'Rear Right Tyre Pressure', position: 'rear right' }
];
export function VehicleOverview({ rows, now }: { rows: SensorRow[]; now: number }) {
  return <section className="vehicle-overview" aria-label="Vehicle tyre pressures">
    <div className="vehicle-halo" />
    <img className="vehicle-image" src="/vehicle-top.png" alt="Overhead view of a Formula Student racing car" />
    <svg className="tyre-connectors" viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true"><path d="M205 90 285 125M595 90 515 125M205 400 285 380M595 400 515 380" />{[[285,125],[515,125],[285,380],[515,380]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" />)}</svg>
    {wheels.map(wheel => {
      const row = rows.find(item => item.sensorName === `TYRE_PRESSURE_${wheel.code}`);
      return <Card key={wheel.code} className={`tyre-card ${wheel.position}`}><h2>{wheel.title}</h2><div className={`tyre-value ${row?.outOfRange ? 'value-danger' : ''}`}>{row?.reading?.value.toFixed(1) ?? '—'} <span>{row?.unit ?? 'kPa'}</span></div><StatusBadge status={row?.status ?? 'No data'} /><p>{row?.reading ? `Updated ${relativeTime(row.reading.timestamp, now)}` : 'Waiting for data'}</p></Card>;
    })}
  </section>;
}
