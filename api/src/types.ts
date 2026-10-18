export interface TelemetryReading {
    sensorId: number;
    value: number;
    timestamp: number;
}

export interface SensorMetadata {
    sensorId: number;
    sensorName: string;
    unit: string;
}
