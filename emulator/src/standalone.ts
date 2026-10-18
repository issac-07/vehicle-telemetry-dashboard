import { startEmulator, telemetryEmitter, TelemetryReading } from './index';

startEmulator();

console.log('Standalone emulator started (logging readings to stdout)');

telemetryEmitter.on('reading', (reading: TelemetryReading) => {
  // In a real deployment this process would push data to another service.
  // For this assessment skeleton we simply log the readings.
  console.log(JSON.stringify(reading));
});

