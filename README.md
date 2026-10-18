# Vehicle Telemetry Dashboard

A fullstack dashboard for monitoring a Formula Student vehicle: a vehicle-centred overview, live sensor values, status indicators and short-term telemetry charts.

**[View the Figma design](https://www.figma.com/design/qYgCQNtVvz2CJYtMPfWhCz?node-id=1-2)** · **[API specification](./openapi.yaml)**

## What you can explore

- **Vehicle overview:** four tyre-pressure readings positioned around a top-down vehicle image.
- **Driving metrics:** vehicle speed, steering angle and front brake pressure.
- **Powertrain metrics:** battery and motor temperature, pack voltage, current and state of charge.
- **Sensor registry:** all 12 sensors, with search, status filtering and sorting by name or update time.
- **Telemetry history:** four overview charts and a Trends view, using readings collected during the current browser session.
- **System visibility:** connection information, sensor issues, loading states and retry messages.

Readings are polled approximately every second. Status labels distinguish **Normal**, **Out of range**, **Stale** and **No data**. A reading becomes stale after five seconds; history covers the most recent 60 seconds.

## Architecture

The local application runs as three services:

| Service | Role | Address |
| --- | --- | --- |
| Emulator | Publishes sensor metadata over HTTP and generated readings over WebSocket | `http://localhost:3001` |
| API | Validates readings, stores the latest reading per sensor and exposes HTTP endpoints | `http://localhost:4000` |
| Frontend | Combines metadata with readings and renders the interactive dashboard | `http://localhost:3000` |

The API subscribes to the emulator's `/ws/telemetry` stream. The frontend requests metadata to resolve sensor IDs into names and units, then polls the API for the latest readings. Browser-side buffers provide chart history.

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui Card components, SVG charts |
| API | Node.js, Express, TypeScript, `ws` |
| Development | Docker Compose, npm |
| Design and documentation | Figma, OpenAPI 3.x |

## Run locally

Install Docker with Docker Compose support, then open a terminal in the project root—the directory containing `docker-compose.yml`.

```bash
docker compose up --build -d
```

Open **http://localhost:3000**. Allow a few seconds for the emulator, API and frontend to start and for readings to arrive.

Check the services:

```bash
docker compose ps
```

Watch API logs, including validation and repeated out-of-range warnings:

```bash
docker compose logs -f api
```

Stop the application:

```bash
docker compose down
```

## API

| Method | Endpoint | Response |
| --- | --- | --- |
| `GET` | `/health` | API health and emulator reachability |
| `GET` | `/sensors` | Sensor metadata: `sensorId`, `sensorName`, `unit` |
| `GET` | `/telemetry` | Latest stored readings: `sensorId`, `value`, `timestamp` |

Telemetry timestamps are Unix time in **seconds**, potentially with a fractional part.

The API rejects malformed readings before storing them. Structurally valid readings outside a sensor's valid range remain visible so the dashboard can flag them. For each sensor, more than three out-of-range events within a rolling five-second window trigger a timestamped console error. The API retries metadata loading and reconnects after a WebSocket disconnect.

The full response schemas and error responses are documented in [`openapi.yaml`](./openapi.yaml). Import that file into [Swagger Editor](https://editor.swagger.io/) to browse the contract. The hosted demo exposes its adapter endpoints under `/api/health`, `/api/sensors` and `/api/telemetry`.

## Design

**[Open the editable Figma dashboard](https://www.figma.com/design/qYgCQNtVvz2CJYtMPfWhCz?node-id=1-2)**

The dark interface groups driving metrics on the left and powertrain metrics on the right. Tyre readings surround the vehicle to make their physical positions immediately clear. Status labels accompany colour cues, while the registry and charts support closer inspection.

The Figma file contains a high-fidelity reference of the main dashboard. Its values and chart traces are illustrative; the implemented application updates from its telemetry source.

## Project structure

```text
api/                         Express API and telemetry processing
emulator/                    Original telemetry generator
frontend/
  public/                    Vehicle image and branding assets
  src/app/                   Dashboard page and global styles
  src/components/dashboard/  Metrics, vehicle view, tables and charts
  src/hooks/                 Polling and telemetry state
  src/lib/                   API client and display helpers
docker-compose.yml           Local service orchestration
openapi.yaml                 API contract
justification.md             Design decisions and trade-offs
```

## Scope and limitations

- The local API keeps the latest readings in memory; restarting it clears that state.
- Chart history is held in the browser and starts when the page is opened. Refreshing the page resets it.
- Frontend polling samples the latest values; charts do not contain every event emitted by the emulator.
- The hosted adapter generates readings when requests arrive and keeps temporary state per cloud instance. It demonstrates the UI and HTTP contract, including simulated invalid and out-of-range samples, but does not demonstrate the Docker API's persistent WebSocket connection or its reconnect behaviour.

## Background

Developed from the [UNSW Redback Racing fullstack assessment scaffold](https://github.com/UNSW-Redback-Racing/va-fullstack-assessment). The original emulator is retained in the Docker project; the implementation adds telemetry API behaviour, validation, reconnection, API documentation and the dashboard interface.
