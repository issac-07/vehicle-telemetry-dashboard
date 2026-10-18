'use client';
import { useId } from 'react';
import { Card } from '../ui/card';
import { displayUnit, HISTORY_MS, sensorLabel, STALE_AFTER_MS, type SensorRow } from '../../lib/telemetry';
import type { TelemetryReading } from '../../lib/api-client';
export function TelemetryChart({ name, sensor, points = [], now, large = false }: { name: string; sensor?: SensorRow; points?: TelemetryReading[]; now: number; large?: boolean }) {
  const id = useId().replaceAll(':', '');
  const data = points.filter(p => p.timestamp * 1000 >= now - HISTORY_MS && p.timestamp * 1000 <= now);
  const base: Record<string, [number, number]> = { VEHICLE_SPEED: [0,250], BATTERY_TEMPERATURE: [20,100], PACK_VOLTAGE: [350,500], BRAKE_PRESSURE_FRONT: [0,120] };
  const domain = base[name] ?? [0,100];
  const min = Math.min(domain[0], ...data.map(p => p.value));
  const max = Math.max(domain[1], ...data.map(p => p.value));
  const x = (p: TelemetryReading) => 37 + (p.timestamp * 1000 - (now - HISTORY_MS)) / HISTORY_MS * 249;
  const y = (value: number) => 101 - (value - min) / (max - min || 1) * 79;
  // Start a new path across missing samples, rather than inventing a continuous signal.
  const groups: TelemetryReading[][] = [];
  data.forEach((p, i) => { if (i === 0 || (p.timestamp - data[i-1].timestamp) * 1000 >= STALE_AFTER_MS) groups.push([]); groups[groups.length-1].push(p); });
  const color = sensor?.status === 'Stale' ? '#f5b83d' : sensor?.outOfRange ? '#ff6b7d' : '#62e9f2';
  const last = data[data.length-1];
  return <Card className={`telemetry-chart ${large ? 'large-chart' : ''}`}>
    <div className="chart-heading"><h3>{sensorLabel(name)}{sensor?.unit ? ` (${displayUnit(sensor.unit)})` : ''}</h3><span>Recent 60 s</span></div>
    <svg viewBox="0 0 340 132" role="img" aria-label={`${sensorLabel(name)} readings over the last 60 seconds${data.length ? '' : ', waiting for live readings'}`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".23"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {[min, (min+max)/2, max].map((v,i) => <g key={i}><line x1="37" x2="286" y1={y(v)} y2={y(v)} className="chart-grid"/><text x="29" y={y(v)+4} textAnchor="end">{v.toFixed(0)}</text></g>)}
      {[37,161.5,286].map((v,i) => <g key={i}><line x1={v} x2={v} y1="22" y2="101" className="chart-grid"/><text x={v} y="123" textAnchor="middle">{['-60 s','-30 s','0 s'][i]}</text></g>)}
      <path d="M37 22V101H286" className="chart-axis"/>
      {groups.map((group,i) => {
        const path = group.map((p,j) => `${j === 0 ? 'M' : 'L'}${x(p).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
        return <g key={i}><path d={`${path} L${x(group[group.length-1])} 101 L${x(group[0])} 101Z`} fill={`url(#${id})`}/><path d={path} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round"/></g>;
      })}
      {last && <><circle cx={x(last)} cy={y(last.value)} r="2.7" fill={color}/><text x="295" y={Math.max(29, Math.min(100, y(last.value)+4))} style={{ fill: color, fontWeight: 600 }}>{last.value.toFixed(1)}</text></>}
      {!last && <text x="165" y="63" textAnchor="middle">Waiting for live readings</text>}
    </svg>
  </Card>;
}
