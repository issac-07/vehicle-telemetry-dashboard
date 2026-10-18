import type { CSSProperties } from 'react';
export function SensorIcon({ name = '', className = '' }: { name?: string; className?: string }) {
  let paths;
  if (name.includes('TEMPERATURE')) paths = <><path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a5 5 0 1 1-4 0Z"/><path d="M12 9v9"/><circle cx="12" cy="18" r="1"/></>;
  else if (name === 'STEERING_ANGLE') paths = <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="m4 9 6 2m4 0 6-2M12 14v7"/></>;
  else if (name === 'PACK_SOC') paths = <><path d="M3 7h17v10H3zM20 10h2v4M6 10v4m3-4v4m3-4v4"/></>;
  else if (name === 'PACK_CURRENT' || name === 'PACK_VOLTAGE') paths = <path d="m13 2-9 12h7l-1 8 10-13h-8z"/>;
  else if (name.includes('TYRE') || name.includes('BRAKE')) paths = <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v3m9 6h-3m-6 9v-3m-9-6h3"/></>;
  else paths = <><path d="M4 19a10 10 0 1 1 16 0M12 13l5-6M5 11l2 1m1-7 1 2m8 7 2 1"/><circle cx="12" cy="13" r="1.5"/></>;
  return <svg className={`sensor-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>;
}
export function Dot({ tone = 'normal' }: { tone?: string }) { return <span aria-hidden="true" className={`status-dot tone-${tone}`} />; }
export function SearchIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg>; }
