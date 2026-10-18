import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Vehicle Analytics – Telemetry Dashboard',
  description: 'Frontend assessment for the Vehicle Analytics technical assessment'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}

