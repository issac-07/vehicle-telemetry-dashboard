'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Card } from '../components/ui/card';
import { MetricCard } from '../components/dashboard/metric-card';
import { VehicleOverview } from '../components/dashboard/vehicle-overview';
import { SensorTable } from '../components/dashboard/sensor-table';
import { TelemetryChart } from '../components/dashboard/telemetry-chart';
import { SystemPanel } from '../components/dashboard/system-panel';
import { Dot, SearchIcon } from '../components/dashboard/icons';
import { useTelemetry } from '../hooks/use-telemetry';
import { relativeTime, sensorLabel } from '../lib/telemetry';
const CHARTS = ['VEHICLE_SPEED','BATTERY_TEMPERATURE','PACK_VOLTAGE','BRAKE_PRESSURE_FRONT'];
export default function Page() {
  const state = useTelemetry();
  const { rows, history, now, health, apiState, errors, latestTimestamp, loading } = state;
  const [tab, setTab] = useState<'Sensors'|'Trends'|'System'>('Sensors');
  const [search, setSearch] = useState('');
  const sensor = (name: string) => rows.find(r => r.sensorName === name);
  const count = (status: string) => rows.filter(r => r.status === status).length;
  const fresh = latestTimestamp !== undefined && now - latestTimestamp*1000 < 5000;
  const emulatorState = apiState === 'checking' ? 'Checking emulator' : !health ? 'Emulator unknown' : !health.emulator ? 'Emulator unavailable' : fresh ? 'Emulator connected' : 'Awaiting telemetry';
  const matches = rows.filter(r => `${sensorLabel(r.sensorName)} ${r.sensorName} ${r.sensorId}`.toLowerCase().includes(search.toLowerCase()));
  const metric = (name: string, compact = false, label?: string) => <MetricCard key={name} name={name} sensor={sensor(name)} now={now} compact={compact} label={label}/>;
  return <main className="dashboard">
    <header className="topbar">
      <div className="brand"><Image src="/logo-darkmode.svg" alt="Spyder" width={44} height={44}/><h1>SPYDER <span>TELEMETRY</span></h1></div>
      <div className="view-title"><span>03 / VEHICLE OVERVIEW</span><small>FORMULA STUDENT · LIVE TELEMETRY</small></div>
      <div className="connection-block"><div><Dot tone={apiState === 'connected' ? 'normal' : apiState === 'checking' ? 'muted' : 'danger'}/><strong>{apiState === 'connected' ? 'API connected' : apiState === 'checking' ? 'Checking API' : 'API offline'}</strong></div><small>Last data: {relativeTime(latestTimestamp,now)}</small></div>
      <div className="connection-block"><div><Dot tone={health?.emulator && fresh ? 'normal' : 'stale'}/><strong>{emulatorState}</strong></div><small>{fresh ? 'Live readings · 1 s polling' : 'Waiting for fresh readings'}</small></div>
      <div className="sensor-count"><strong>{rows.length} Sensors</strong><small><span>{count('Normal')} Normal</span><span className={count('Out of range') ? 'value-danger' : ''}>{count('Out of range')} Out of Range</span><span className={count('Stale') ? 'value-stale' : ''}>{count('Stale')} Stale</span>{count('No data') > 0 && <span>{count('No data')} No data</span>}</small></div>
    </header>
    <div className="dashboard-content">
      {Object.keys(errors).length > 0 && <div role="alert" className="error-banner"><strong>Connection needs attention</strong><span>{Object.values(errors).join(' · ')}. Retrying automatically.</span></div>}
      {loading && <div role="status" className="loading-banner"><span className="loading-pulse"/>Loading sensor metadata and live telemetry…</div>}
      <section className="overview-grid" aria-label="Live vehicle telemetry">
        <div className="left-metrics">{metric('VEHICLE_SPEED')}{metric('STEERING_ANGLE')}{metric('BRAKE_PRESSURE_FRONT')}</div>
        <VehicleOverview rows={rows} now={now}/>
        <div className="right-metrics">{metric('BATTERY_TEMPERATURE')}{metric('MOTOR_TEMPERATURE')}{metric('PACK_SOC')}<div className="pack-pair">{metric('PACK_VOLTAGE',true)}{metric('PACK_CURRENT',true)}</div></div>
      </section>
      <Card className="data-panel">
        <div className="panel-toolbar"><div role="tablist" aria-label="Telemetry views" className="view-tabs">{(['Sensors','Trends','System'] as const).map(label => <button key={label} id={`tab-${label}`} role="tab" aria-controls={`panel-${label}`} aria-selected={tab === label} onClick={() => setTab(label)} onKeyDown={event => {
          const tabs = ['Sensors','Trends','System'] as const; const index = tabs.indexOf(tab);
          const next = event.key === 'ArrowRight' ? tabs[(index+1)%3] : event.key === 'ArrowLeft' ? tabs[(index+2)%3] : event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[2] : undefined;
          if(next) { event.preventDefault(); setTab(next); document.getElementById(`tab-${next}`)?.focus(); }
        }} tabIndex={tab === label ? 0 : -1}>{label}</button>)}</div>
          <div className="search-toolbar"><span>{rows.length} sensors</span><label className="search-box"><SearchIcon/><input aria-label="Search sensors" placeholder="Search sensors…" value={search} onChange={e => setSearch(e.target.value)}/>{search && <button aria-label="Clear search" onClick={() => setSearch('')}>×</button>}</label></div>
        </div>
        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className={`panel-content panel-${tab.toLowerCase()}`}>
          {tab === 'Sensors' && <><SensorTable rows={matches} now={now}/><div className="chart-grid">{CHARTS.map(name => <TelemetryChart key={name} name={name} sensor={sensor(name)} now={now} points={history[sensor(name)?.sensorId ?? -1]}/>)}</div></>}
          {tab === 'Trends' && <div className="all-trends">{matches.map(row => <TelemetryChart key={row.sensorId} name={row.sensorName} sensor={row} now={now} points={history[row.sensorId]} large/>)}{!matches.length && <p className="empty-state">No sensors match your search.</p>}</div>}
          {tab === 'System' && <SystemPanel {...state} rows={matches}/>}
        </div>
      </Card>
      <footer className="dashboard-footer"><span><Dot tone={fresh ? 'normal' : 'muted'}/>{fresh ? 'LIVE DATA' : 'WAITING FOR DATA'}</span><span>History: last 60 s · Stale after 5 s</span><span>SPYDER / VEHICLE ANALYTICS</span></footer>
    </div>
  </main>;
}
