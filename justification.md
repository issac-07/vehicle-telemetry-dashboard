# Vehicle Analytics Fullstack Assessment – Justification

## API

Use this file to briefly explain your design decisions. Bullet points are fine.

### 1. Overall API design

<!-- - Summary of your API structure and main routes (paths, methods, and what they return): -->
The API have 3 main things:
- /health to check if the APU can reach the emulator
- /sensors return that sensor metadata, including SensorId, SensorName, unit
- /telemetry return the lastest valid reading stored for each sensor.

The API also connects to the emulator WebSocket to continuously receive live telemetry readings.
*This is different for API -> Frontend (where use REST polling, each second Frontend call once) 

I separate the HTTP API from the emulator so that the frontend only need to communicated with API. Here it validate, process and store 
telemetry data before showing in frontend

### 2. Data vs metadata separation

<!-- - How clients should use your metadata route(s) vs your data route(s) (and streaming, if implemented): -->

Sensor metadata and telemetry data are exposed separately because they have different purposes and update rates.

- /sensor provide mostly static info such as the sensor name and unit.
The frontend can fetch this data to map a 'sensorID' to a readable name

- /telemetry provide the lastest readings (value, timestamp) for each sensor

This avoid repeatedly sending SensorName and Units with every telemetry 
reading while keeping the API simple, since only timestamp and value changed.

The emulator does not store the lastest readings, so the API stores the lastest valid reading for each 'sensorID' in an in-memory 'MAP'


### 3. Emulator (read-only)

<!-- - Confirm you did not modify the emulator service (`emulator/`) or its `sensor-config.json`. If you needed to work around anything, note it here: y/N -->

I did not modify the emulator service or `sensor-config.json`.

The API treats the emulator as a read-only data source. It consumes:

- `GET /sensors` for sensor metadata.
- `WS /ws/telemetry` for live telemetry readings.

### 4. OpenAPI / Swagger

<!-- - Where your final OpenAPI spec lives and how to view or use it (e.g. Swagger UI): -->
- The final OpenAPI 3.0 specification is located at `/openapi.yaml`.

- It documents the `/health`, `/sensors`, and `/telemetry` endpoints, including their response schemas and error responses.

- The specification can be opened in an OpenAPI-compatible viewer such as Swagger Editor.

### 5. Testing and error handling

<!-- What I tested -->
- I tested the API routes `/health`, `/sensors`, and `/telemetry` while running the project with Docker Compose.
    <!-- docker compose up --build -d ------------------------------------>
    /health - http://localhost:4000/health
    → {"status":"ok","emulator":true}

    /sensors - http://localhost:4000/sensors
    → list of sensor metadata

    /telemetry - http://localhost:4000/telemetry
    → list of latest readings

- I checked the API logs using `docker compose logs -f api` to confirm that:    
    - I verified that the API can reach the emulator, load sensor metadata, receive live telemetry through WebSocket, and return the latest readings through `/telemetry`.
        <!-- docker compose logs -f api ---------------------------------->

    - invalid telemetry readings were dropped,
        <!-- Dropped invalid telemetry: ... -->
    - out-of-range events were detected and logged.
        <!-- ERROR: Sensor ... out of range more than 3 times in 5 seconds -->

<!-- Error-handling decisions -->
- If the emulator cannot be reached, the API reports an unhealthy state instead of crashing.
    <!-- {"status":"unhealthy","emulator":false} -->

- If `/sensors` cannot reach the emulator, the API returns an error response instead of pretending that sensor data is available.
    <!-- {"error":"Emulator unavailable"} -->

- If a telemetry message cannot be parsed as JSON, the API logs the error and skips that message instead of crashing.
- If the WebSocket connection reports an error, the API logs the error so the issue is visible during debugging.

- Invalid telemetry readings are dropped before they can replace a valid latest reading.

- Structurally valid but out-of-range readings are still stored as the latest reading, because they may represent important vehicle behaviour 
rather than malformed data.


### 6. Invalid data from the emulator (Task 2)

<!-- - How you detect invalid readings from the emulator stream:
- What you do with invalid data (drop, log, count, etc.) and why: -->

<!-- How invalid readings are detected -->
- After each WebSocket message is parsed from JSON, the API passes the result to `isValidTelemetryReading()`.
- A reading is considered valid only if:
    - it is an object,
    - it contains exactly `sensorId`, `value`, and `timestamp`,
    - all three fields are finite numbers.
- If any of these checks fail, the reading is classified as invalid.

<!-- What happens to invalid data, and why -->
- Invalid readings are dropped immediately and a warning is logged to the console.
- They are not stored in the latest-reading `Map`.
- This prevents malformed emulator data from replacing a valid reading 
or being returned to the frontend.

### 7. Out-of-range values per sensor (Task 3)

<!-- - How you use the valid-range table (sensor name or sensorId → min/max) and count out-of-range readings per sensor in a 5-second window:
- How you log the timestamp and error message (including sensor) when a sensor exceeds the threshold (&gt;3 out-of-range in 5 s): -->

- The valid min/max ranges are stored in `SENSOR_RANGES`, indexed by sensor name.
- The API first loads sensor metadata. After that, it builds a `sensorId -> sensorName` mapping. That way, it knows which number 
is belongs to what part of the sensor.
- When a valid reading arrives, the API uses the sensor ID to find the sensor name and then checks the value against the correct range.
    <!-- id 12312231-> map to VEHICLE_SPEED -> get table range 0–250 -> compare value = 280 -> out-of-range -> return false -->
- For each sensor, recent out-of-range event timestamps are stored in an `outOfRangeEvents` Map. For each sensor, it save the timestamp 
of each error. 
- Whenever a new out-of-range event occurs, timestamps older than 5 seconds are removed and the current timestamp is added.
- If more than 3 out-of-range readings remain within the 5-second window for the same sensor, the API logs the current ISO timestamp and an error message containing the sensor ID.
- Each sensor are counted error separatedly in lastest 5 seconds interval, only the sensor with more than 3 out-of-range is logged.


## Frontend

Use this section to briefly explain your frontend design decisions. Bullet points are fine.

### 1. Figma mockup

- Link to your low-fidelity Figma mockup and what it shows:

### 2. Layout and information hierarchy

- Why you structured the dashboard the way you did:

### 3. API consumption

- How you use `/sensors` and `/telemetry` (and WebSocket, if used):

### 4. Visual design and usability

- Choices around colours, typography, states, and responsiveness:

### 5. Trade-offs and limitations

- Anything you would do with more time or a different stack:
