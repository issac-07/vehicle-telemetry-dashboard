import WebSocket from 'ws';

import type {
  TelemetryReading,
  SensorMetadata
} from './types';

// Save the reading
const latestReadings = new Map<number, TelemetryReading>();
const sensorNames = new Map<number, string>();
const outOfRangeEvents = new Map<number, number[]>();

// Add the range 
const SENSOR_RANGES: Record<string, { min: number; max: number }> = {
    BATTERY_TEMPERATURE: { min: 20, max: 80 },
    MOTOR_TEMPERATURE: { min: 30, max: 120 },

    TYRE_PRESSURE_FL: { min: 150, max: 250 },
    TYRE_PRESSURE_FR: { min: 150, max: 250 },
    TYRE_PRESSURE_RL: { min: 150, max: 250 },
    TYRE_PRESSURE_RR: { min: 150, max: 250 },

    PACK_CURRENT: { min: -300, max: 300 },
    PACK_VOLTAGE: { min: 350, max: 500 },
    PACK_SOC: { min: 0, max: 100 },

    VEHICLE_SPEED: { min: 0, max: 250 },
    STEERING_ANGLE: { min: -180, max: 180 },
    BRAKE_PRESSURE_FRONT: { min: 0, max: 120 }
};


export function storeLatestReading(reading: TelemetryReading) {
    latestReadings.set(reading.sensorId, reading);
}

export function getLatestReadings(): TelemetryReading[] {
    return Array.from(latestReadings.values());
}

// Check whether a telemetry reading has the expected fields and data types.
// Detect
function isValidTelemetryReading(
  data: unknown
): data is TelemetryReading {
    if (typeof data !== 'object' || data === null) {
        return false;
    }

    const reading = data as Record<string, unknown>;

    const keys = Object.keys(reading);

    if (
        keys.length !== 3 ||
        !keys.includes('sensorId') ||
        !keys.includes('value') ||
        !keys.includes('timestamp')
    ) {
        return false;
    }

    return (
        typeof reading.sensorId === 'number' &&
        Number.isFinite(reading.sensorId) &&
        typeof reading.value === 'number' &&
        Number.isFinite(reading.value) &&
        typeof reading.timestamp === 'number' &&
        Number.isFinite(reading.timestamp)
    );
}

// Open a WebSocket connection to receive live telemetry from the emulator.
// Async - function has a wait function

 // Open a WebSocket connection and reconnect if disconnected.
export function connectTelemetryStream(emulatorUrl: string) {
    const RECONNECT_DELAY_MS = 3000;

    const wsUrl =
        emulatorUrl.replace(/^http/, 'ws').replace(/\/$/, '') +
        '/ws/telemetry';

    async function connect() {
        // Load metadata before connecting to the telemetry stream
        const metadataLoaded = await loadSensorMetadata(emulatorUrl);

        if (!metadataLoaded) {
            console.warn(
                'Sensor metadata unavailable. Retrying in 3 seconds...'
            );

            setTimeout(() => {
                void connect();
            }, RECONNECT_DELAY_MS);

            return;
        }

        console.log(`Connecting to telemetry stream: ${wsUrl}`);

        const socket = new WebSocket(wsUrl);

        // Connection established
        socket.on('open', () => {
            console.log(`Connected to telemetry stream: ${wsUrl}`);
        });

        // Receive and validate telemetry data
        socket.on('message', (data) => {
            try {
                const parsed: unknown = JSON.parse(data.toString());

                if (!isValidTelemetryReading(parsed)) {
                    console.warn('Dropped invalid telemetry:', parsed);
                    return;
                }

                if (isOutOfRange(parsed.sensorId, parsed.value)) {
                    recordOutOfRange(parsed.sensorId);
                }

                storeLatestReading(parsed);

                console.log('Stored telemetry:', parsed);
            } catch (error) {
                console.error('Invalid telemetry JSON:', error);
            }
        });

        // Log WebSocket errors
        socket.on('error', (error) => {
            console.error('Telemetry WebSocket error:', error);
        });

        // Reconnect when the WebSocket closes
        socket.on('close', () => {
            console.warn(
                `Telemetry disconnected. Reconnecting in 3 seconds...`
            );

            setTimeout(() => {
                void connect();
            }, RECONNECT_DELAY_MS);
        });

    } // End of connect()

    // Start the first connection only once
    void connect();

} // End of connectTelemetryStream()



// Load sensor metadata before processing telemetry.
async function loadSensorMetadata(
    emulatorUrl: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `${emulatorUrl.replace(/\/$/, '')}/sensors`
        );

        if (!response.ok) {
            console.error(
                `Failed to load sensor metadata: HTTP ${response.status}`
            );
            return false;
        }

        const sensors = await response.json() as SensorMetadata[];

        if (!Array.isArray(sensors) || sensors.length === 0) {
            console.error('Sensor metadata is empty or invalid');
            return false;
        }

        sensorNames.clear();

        for (const sensor of sensors) {
            sensorNames.set(sensor.sensorId, sensor.sensorName);
        }

        console.log(`Loaded metadata for ${sensorNames.size} sensors`);

        return true;
    } catch (error) {
        console.error('Failed to load sensor metadata:', error);
        return false;
    }
}

function isOutOfRange(
    sensorId: number,
    value: number
): boolean {
    // from ID 123123121, get the name VEHICLE_SPEED
    const sensorName = sensorNames.get(sensorId);

    if (!sensorName) {
        return false;
    }

    // get range 0–250 from table
    const range = SENSOR_RANGES[sensorName];

    if (!range) {
        return false;
    }

    // compare then return 
    return value < range.min || value > range.max;
}

function recordOutOfRange(sensorId: number) {
    const now = Date.now();

    const previousEvents =
        outOfRangeEvents.get(sensorId) ?? [];

    const recentEvents = previousEvents.filter(
        timestamp => now - timestamp <= 5000
    );

    recentEvents.push(now);

    outOfRangeEvents.set(sensorId, recentEvents);

    if (recentEvents.length > 3) {
        console.error(
        `${new Date(now).toISOString()} ERROR: ` +
        `Sensor ${sensorId} out of range more than 3 times in 5 seconds`
        );
    }
}