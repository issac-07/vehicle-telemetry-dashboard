## Vehicle Analytics Fullstack Assessment

Your task is to **design and implement** a clean API and a telemetry dashboard frontend. This
repository (**va-fullstack-assessment**) provides a **skeleton** API (health check only), a
**separate emulator service** that generates data, and a minimal frontend in `frontend/`. You must
define and implement the API routes that consume the emulator and expose sensor metadata and
telemetry, then build the frontend that consumes that API.

The focus is on:

- API design and separation of concerns (metadata vs data); clear, consistent contracts and error handling.
- **You** produce an OpenAPI/Swagger spec that documents your **final** API (no full spec is provided; only the health endpoint is pre-defined).
- A frontend that visualises multiple sensors with good UX; both API and frontend are part of the assessment.

---

## Scenario

You are given:

- A **data emulator** (in `emulator/`) that runs as a **separate service** and generates
  readings for several sensors. The emulator is **read-only** – do not modify it.
- A minimal Node.js + TypeScript API skeleton in `api/`: Express server, CORS, and
  `GET /health`. No other routes are implemented; your API must **consume the emulator**
  (via HTTP/WebSocket) and expose the data to clients.

Each sensor has:

- A long **numeric `sensorId`** (computed inside the emulator from `busNumber`, `frameId`,
  `signalIndex` – see emulator code).
- A human-readable name and a unit.

---

## API

**You may NOT modify the emulator (`emulator/`) for any task.** Justify your approach in `justification.md`.

### Required behaviour

Your API must support the following; the exact paths, HTTP methods, and payload shapes are for you to design.

1. **Health** – A health check is already implemented at `GET /health`. You may keep it as-is or extend it.
2. **Metadata** – Clients need a way to discover sensors and map `sensorId` → `sensorName` and `unit`. Expose at least **sensorId**, **sensorName**, **unit** per sensor.
3. **Data** – Clients need access to **latest** telemetry (sensorId, value, timestamp). Optionally offer **streaming** (e.g. WebSocket or SSE).
4. **Documentation** – Document your **final** API with an OpenAPI 3.x spec and state in `justification.md` how to view or use it (e.g. Swagger UI).

### Tasks

1. **API design**  
   Design and implement the API surface on top of the emulator: choose paths, methods and
   response shapes for your metadata and data routes (and optional streaming), and document
   them with an OpenAPI 3.x spec. Explain your design choices and trade-offs.

2. **Invalid data from the emulator**  
   When running, the emulator occasionally sends readings in an **incorrect format** (e.g. wrong types, extra fields). This will be visible if you forward the raw stream to clients. Add logic in the **API** so that invalid data is not sent to the frontend (or stored as latest). What you do with invalid data (drop, log, count, etc.) is up to you, so long as it is justified in `justification.md`.

3. **Out-of-range values (sensor-specific)**  
   The emulator occasionally sends values **outside the valid range** for a sensor. Treat a reading as out-of-range when **value** is outside the valid min–max for that sensor in the table below. For **each sensor**, when out-of-range values occur **more than 3 times in 5 seconds**, print the current timestamp and a short error message (including the sensor identifier) to the console.

   **Valid range per sensor** (treat value outside [min, max] as out-of-range):

   | Sensor name           | Valid min | Valid max | Unit |
   |-----------------------|-----------|-----------|------|
   | BATTERY_TEMPERATURE   | 20        | 80        | °C   |
   | MOTOR_TEMPERATURE     | 30        | 120       | °C   |
   | TYRE_PRESSURE_FL      | 150       | 250       | kPa  |
   | TYRE_PRESSURE_FR      | 150       | 250       | kPa  |
   | TYRE_PRESSURE_RL      | 150       | 250       | kPa  |
   | TYRE_PRESSURE_RR      | 150       | 250       | kPa  |
   | PACK_CURRENT          | -300      | 300       | A    |
   | PACK_VOLTAGE          | 350       | 500       | V    |
   | PACK_SOC              | 0         | 100       | %    |
   | VEHICLE_SPEED         | 0         | 250       | km/h |
   | STEERING_ANGLE        | -180      | 180       | deg  |
   | BRAKE_PRESSURE_FRONT  | 0         | 120       | bar  |

---

## Frontend

The `frontend/` folder contains a minimal Next.js app. Your task is to design and implement a **telemetry dashboard** that consumes the API you build above.

### Required behaviour

- Clear visualisation of multiple sensors; good UX and information hierarchy.
- Consume **both** the **metadata** route(s) and **data** route(s) / WebSocket stream you design in the API.
- A **low-fidelity Figma mockup** with short justifications in `justification.md` (Frontend section).
- Use **shadcn/ui** for core layout and UI. The scaffold in `frontend/` is Next.js with `src/app/page.tsx` and `src/lib/api-client.ts`; extend these to call your API and display telemetry.

### Tasks

1. **API consumption**  
   Use the metadata endpoint to resolve `sensorId` to human-readable `sensorName` and `unit`. Use the data endpoint(s) to display current values and, optionally, basic history.

2. **Low-fidelity Figma mockup**  
   Create a minimal low-fidelity Figma mockup of the key dashboard screen(s). Document the Figma link and brief UX justifications in `justification.md` (Frontend section).

3. **Dashboard behaviour**  
   Show multiple sensors at once; make it clear which sensors are most important. Apply sensible formatting (e.g. decimal places, units). You may choose how to represent “status” (e.g. colours, badges).

4. **Code quality**  
   Use idiomatic React/Next.js (App Router). Keep components small and focused.

---

## Emulator (read-only, black box)

The **only** emulator lives under `emulator/`. It is a **black box**: it does not store or
hold data; it only outputs a stream of readings. Do not modify the emulator code or config.

- **`emulator/src/sensor-config.json`** – defines sensors (busNumber, frameId, signalIndex,
  sensorName, unit, minValue, maxValue, intervalMs). Do not change it.
- **What the emulator exposes** (when the emulator service is running):
  - `GET /sensors` – **static** metadata only: list of `{ sensorId, sensorName, unit }`
    (no min/max). This is config from file, not stored telemetry.
  - `WS /ws/telemetry` – **stream** of readings `{ sensorId, value, timestamp }` as they
    are generated. The emulator does not serve "latest" or keep any state. **Occasionally**
    it sends a reading in an incorrect format (e.g. wrong types or extra fields), and
    occasionally a **value outside the sensor’s valid range** (overspill); the API must
    handle both.

---

## Setup and running

The emulator, API, and frontend are run via **Docker Compose**.

**Prerequisites:** Docker and Docker Compose.

From the repository root:

```bash
cd va-fullstack-assessment
docker compose up --build
```

This starts:

- **emulator** on port **3001**
- **api** on port **4000** (uses `EMULATOR_URL=http://emulator:3001`)
- **frontend** on port **3000** (uses API at `http://localhost:4000`)

The API skeleton implements `GET /health` (which checks that the emulator is reachable).
You must add routes that consume the emulator stream, store latest per sensor, and expose
metadata and latest telemetry. The frontend then consumes those routes.

To run in the background: `docker compose up --build -d`.

**Local development (optional):** With Node.js **18+** you can run without Docker. You must
run **both** the emulator and the API (the API needs the emulator to get data).

1. **Emulator** (run first, in one terminal):

   ```bash
   cd va-fullstack-assessment/emulator
   npm install
   npm run build
   npm start
   ```

   Emulator listens on `http://localhost:3001`.

2. **API** (in another terminal):

   ```bash
   cd va-fullstack-assessment/api
   npm install
   npm run dev
   ```
   
   By default the API expects the emulator at `http://localhost:3001`. API: `http://localhost:4000`.

3. **Frontend** (optional, with API running):

   ```bash
   cd va-fullstack-assessment/frontend
   npm install
   npm run dev
   ```

   Visit `http://localhost:3000` (API base URL defaults to `http://localhost:4000`).

---

## What to put in `justification.md`

**API** (root `justification.md`):

- Your **API design**: chosen paths, methods, and response shapes for metadata and data
  (and streaming if implemented).
- How you expect clients to use your API (e.g. call metadata once, then poll or stream data).
- How to view or use your OpenAPI spec (e.g. file path, Swagger UI URL).
- Testing and error-handling approach.
- **Task 2 (invalid data):** How you detect and handle invalid readings; what you do with
  them and why.
- **Task 3 (out-of-range per sensor):** How you implement the valid-range table and "&gt;3 out-of-range in 5 s per sensor" console logging.
- Any design trade-offs (e.g. polling vs WebSocket, filtering, or future extensions you
  considered).

**Frontend** (in `justification.md`):

- A link to your Figma mockup and what it covers.
- Why you chose your particular layout and components.
- How you expect engineers to use this dashboard (what questions it helps answer).
- Any trade-offs or limitations you are aware of.

---

## Helpful resources

**API**

- [Node.js documentation](https://nodejs.org/docs/latest-v18.x/api/)
- [Express.js guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [OpenAPI / Swagger basics](https://swagger.io/docs/specification/about/)
- [WebSockets in Node (`ws`)](https://github.com/websockets/ws)

**Frontend**

- [Next.js documentation](https://nextjs.org/docs)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [shadcn/ui documentation](https://ui.shadcn.com/docs)
- [shadcn Studio](https://shadcnstudio.com/)
- [React documentation](https://react.dev/learn)
- [tweakcn documentation](https://tweakcn.com/)
