# Changelog

## [1.1.0] - 2026-03-30

### Phase 3: Frontend Implementation

---

## Phase 3: Frontend

A React single-page application providing the operator-facing command interface for the GERCS platform. Built with Vite, React 18, Tailwind CSS, and a dark tactical design language styled to the Ghana Emergency Response Command System identity.

### Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + Vite | SPA framework and dev/build tooling |
| React Router v6 | Client-side routing with protected routes |
| Tailwind CSS v3 | Utility-first styling |
| Axios | HTTP client with JWT interceptor |
| Socket.io-client | WebSocket connection to dispatch-service |
| Leaflet + React Leaflet | Interactive map rendering |
| Recharts | Analytics charts |
| Lucide React | Icon system |

### Design System (`src/index.css`)

A custom CSS design system layered on top of Tailwind:
- **Colour palette** — deep navy backgrounds (`#02060f`, `#040b18`, `#071422`), Ghana national colours (red `#ce1126`, gold `#fcd116`, green `#006b3f`) used as accent and branding elements
- **Typography** — DM Sans for body text, Rajdhani for display/label text (tactical aesthetic)
- **Components** — `.glass-card`, `.cmd-input`, `.status-badge`, `.data-table`, `.pulse-dot`, `.live-badge`, `.ghana-stripe`, `.spinner` utility classes
- **Leaflet dark theme** — overrides for popup, zoom controls, and attribution to match the dark UI
- **Recharts theme** — grid line and tooltip colour overrides

### Routing (`App.jsx`)

```
/               → redirect to /dispatch
/login          → Login page (public)
/dispatch       → DispatchStatus (protected)
/incidents/new  → NewIncident (protected)
/tracking       → VehicleTracking (protected)
/analytics      → Analytics (protected)
```

All routes except `/login` are wrapped in `ProtectedRoute`, which redirects unauthenticated users to `/login`.

---

### Files Implemented

#### `src/api/client.js`
Axios factory used by all pages. Creates per-service clients with:
- Automatic `Authorization: Bearer <token>` header injection from `localStorage`
- Global 401 handler: clears token and redirects to `/login`

Exports: `authApi`, `resourceApi`, `incidentApi`, `dispatchApi`, `analyticsApi`

---

#### `src/contexts/AuthContext.jsx`
React context wrapping the entire app. Provides:
- `login(email, password)` — POST to `/auth/login`, stores `accessToken` in localStorage
- `register(name, email, password, role)` — POST to `/auth/register`, stores token
- `logout()` — clears token and user state
- `user`, `token`, `loading` state accessible via `useAuth()` hook
- Auto-restores session on page load via `GET /auth/profile` using stored token

---

#### `src/components/ProtectedRoute.jsx`
Route guard component — renders `<Outlet />` if authenticated, redirects to `/login` otherwise.

---

#### `src/components/Layout.jsx`
Persistent shell rendered around all protected pages. Contains:
- **Top bar** — GERCS logo/name, Ghana stripe accent, live clock with date, logged-in user name and role badge, logout button
- **Sidebar navigation** — links to Dispatch Status, New Incident, Vehicle Tracking, Analytics with active-state highlighting and Lucide icons
- **Connection status indicator** — shows backend reachability state
- Auto-refreshes the clock every second

---

#### `src/pages/Login.jsx`
Authentication page with two modes toggled by a tab switcher:

**Sign In tab:**
- Email + password fields
- Submits to `POST /auth/login`

**Register tab:**
- Name, email, password fields
- Role selector: `system_admin`, `hospital_admin`, `police_admin`, `fire_admin`, `ambulance_driver`
- Submits to `POST /auth/register`

Both modes store the returned `accessToken` and redirect to `/dispatch` on success. Inline error display for API failures.

**Decorative elements:** dot-grid background, animated radar sweep rings, corner coordinate/classification labels, Ghana stripe top and bottom borders.

---

#### `src/pages/DispatchStatus.jsx`
Live incident monitoring dashboard. Features:
- Fetches all incidents from `GET /incidents` on mount and on manual refresh
- Summary stat cards: total, active (created + dispatched + in_progress), resolved, and in-progress counts
- Full incident table with columns: ID, type badge, citizen, location, assigned unit, status badge with pulse dot, time elapsed
- Colour-coded status badges and incident type icons
- Manual refresh button with loading state

---

#### `src/pages/NewIncident.jsx`
Incident creation form. Features:
- **Interactive Leaflet map** — click anywhere on the map to pin the incident location; coordinates auto-populate the lat/lon fields
- Fields: citizen name, citizen phone, incident type (medical, fire, crime, accident, other), address/notes, latitude, longitude
- Submits to `POST /incidents`
- On success: shows a confirmation panel with the created incident ID, assigned unit type, and status; provides navigation to dispatch status
- Map centred on Accra, Ghana (5.6037, -0.1870) by default

---

#### `src/pages/VehicleTracking.jsx`
Real-time vehicle tracking map. Features:
- Connects to dispatch-service WebSocket (`ws://localhost:3004`) with JWT auth on handshake
- Fetches initial vehicle list from `GET /vehicles`
- Listens for `location_update` WebSocket events and updates vehicle markers in real time
- Leaflet map with custom SVG markers colour-coded by vehicle type (ambulance = blue, police = red, fire truck = orange)
- Vehicle list sidebar showing status, last known coordinates, and connection indicator
- WebSocket connection status badge (live/disconnected)

---

#### `src/pages/Analytics.jsx`
Analytics dashboard with four data panels, all sourced from analytics-service:

| Panel | Endpoint | Chart type |
|---|---|---|
| Summary KPIs | `GET /analytics/dashboard` | Stat cards |
| Response Times by Type | `GET /analytics/response-times` | Bar chart |
| Incidents by Region | `GET /analytics/incidents-by-region` | Bar chart |
| Resource Utilization | `GET /analytics/resource-utilization` | Pie chart |

Auto-refreshes every 30 seconds. Manual refresh button. Empty/loading states for all panels.

---

### Build Configuration

**`vite.config.js`** — manual chunk splitting for optimal load performance:
- `react-vendor` — react, react-dom, react-router-dom
- `map` — leaflet, react-leaflet
- `charts` — recharts
- `io` — socket.io-client, axios

Production build output: 6 chunks, largest 400KB (recharts), down from a single 863KB bundle.

**`tailwind.config.js`** — scans `./src/**/*.{js,jsx}` for class purging.

---

### Docker & Infrastructure Fixes

- Removed host port bindings from all 5 PostgreSQL containers in `docker-compose.yml` to avoid conflicts with local Postgres installations. Services communicate internally via container names on `emergency-network`.
- Removed obsolete `version: '3.8'` top-level key from `docker-compose.yml`.

---

## [1.0.0] - 2026-03-20

### Initial Implementation — Phase 1 (System Design) & Phase 2 (Backend)

---

## Phase 1: System Design

### Microservice Architecture

Five independent microservices were designed and implemented, each with its own database, API, and isolated runtime:

| Service           | Port | Database     |
|-------------------|------|--------------|
| auth-service      | 3001 | auth_db      |
| resource-service  | 3002 | resource_db  |
| incident-service  | 3003 | incident_db  |
| dispatch-service  | 3004 | dispatch_db  |
| analytics-service | 3005 | analytics_db |

### Database Design

**auth-service — `users` table**
- id (UUID, PK)
- name (STRING)
- email (STRING, unique)
- passwordHash (STRING)
- role (ENUM: system_admin, hospital_admin, police_admin, fire_admin, ambulance_driver)
- isActive (BOOLEAN)
- refreshToken (TEXT)
- createdAt, updatedAt

**resource-service — 4 tables**

`hospitals`
- id, name, address, latitude, longitude
- totalBeds, availableBeds, phone, adminUserId, isActive

`ambulances`
- id, vehicleNumber, hospitalId (FK → hospitals)
- driverUserId, latitude, longitude
- status (ENUM: available, dispatched, maintenance)

`police_stations`
- id, name, address, latitude, longitude
- phone, adminUserId, officerCount, availableUnits, isActive

`fire_stations`
- id, name, address, latitude, longitude
- phone, adminUserId, availableTrucks, isActive

**incident-service — `incidents` table**
- id, citizenName, citizenPhone
- incidentType (ENUM: medical, fire, crime, accident, other)
- latitude, longitude, address, notes
- createdBy (admin user ID)
- assignedUnitId, assignedUnitType, assignedHospitalId
- status (ENUM: created, dispatched, in_progress, resolved)
- dispatchedAt, resolvedAt, responseTimeMinutes

**dispatch-service — 2 tables**

`vehicles`
- id, vehicleNumber, vehicleType (ENUM: ambulance, police_car, fire_truck)
- stationId, stationType, incidentId, driverUserId
- latitude, longitude, status, lastUpdated

`location_history`
- id, vehicleId, incidentId, latitude, longitude, recordedAt

**analytics-service — `incident_snapshots` table**
- id, incidentId (unique), incidentType
- latitude, longitude, status, assignedUnitType
- responseTimeMinutes, incident_created_at, resolvedAt, region

### Message Queue Definitions (RabbitMQ)

Three durable queues:

| Queue                | Publisher         | Consumers                          |
|----------------------|-------------------|------------------------------------|
| `incident.created`   | incident-service  | analytics-service                  |
| `incident.dispatched`| incident-service  | dispatch-service, analytics-service|
| `incident.resolved`  | incident-service  | analytics-service                  |

**`incident.created` message structure:**
```json
{
  "incidentId": "uuid",
  "incidentType": "medical|fire|crime|accident|other",
  "latitude": 5.6037,
  "longitude": -0.1870,
  "createdBy": "adminUserId",
  "createdAt": "ISO timestamp"
}
```

**`incident.dispatched` message structure:**
```json
{
  "incidentId": "uuid",
  "assignedUnitId": "uuid",
  "assignedUnitType": "ambulance|police_station|fire_station",
  "assignedHospitalId": "uuid|null",
  "dispatchedAt": "ISO timestamp"
}
```

**`incident.resolved` message structure:**
```json
{
  "incidentId": "uuid",
  "resolvedAt": "ISO timestamp",
  "responseTimeMinutes": 12.5
}
```

### API Definitions

All services require `Authorization: Bearer <JWT>` unless noted.

**auth-service:**
- `POST /auth/register` — register a new user (name, email, password, role)
- `POST /auth/login` — authenticate and receive JWT tokens
- `POST /auth/refresh-token` — exchange refresh token for new access token
- `GET /auth/profile` — get authenticated user's profile
- `GET /auth/validate` — validate JWT (used inter-service)
- `GET /auth/users/:id` — fetch user by ID

**resource-service:**
- `GET/POST /hospitals` — list or create hospitals
- `GET/PUT /hospitals/:id` — get or update a hospital
- `GET /hospitals/:id/capacity` — check bed availability
- `POST /hospitals/nearest` — find nearest hospital with available ambulance
- `GET/POST /ambulances` — list or register ambulances
- `GET/PUT /ambulances/:id` — get or update an ambulance
- `POST /ambulances/nearest` — find nearest available ambulance (by lat/lon)
- `GET/POST /police-stations` — list or create stations
- `GET/PUT /police-stations/:id` — get or update a station
- `POST /police-stations/nearest` — find nearest available station
- `GET/POST /fire-stations` — list or create stations
- `GET/PUT /fire-stations/:id` — get or update a station
- `POST /fire-stations/nearest` — find nearest available station

**incident-service:**
- `POST /incidents` — create incident + auto-dispatch nearest responder
- `GET /incidents` — list all incidents (filterable by status, type)
- `GET /incidents/open` — list active/unresolved incidents
- `GET /incidents/:id` — get incident details
- `PUT /incidents/:id/status` — update incident status
- `PUT /incidents/:id/assign` — manually assign a responder
- `GET /incidents/analytics/summary` — internal analytics endpoint

**dispatch-service:**
- `POST /vehicles/register` — register a vehicle
- `GET /vehicles` — list vehicles (filterable by status, incidentId)
- `GET /vehicles/:id` — get vehicle details
- `GET /vehicles/:id/location` — get current GPS location
- `GET /vehicles/:id/location/history` — get last 100 location records
- `PUT /vehicles/:id/location` — update vehicle GPS (called by driver device)
- `PUT /vehicles/:id/status` — update vehicle status
- **WebSocket** `ws://localhost:3004` — real-time location stream

**analytics-service:**
- `GET /analytics/response-times` — avg/min/max response times overall and by incident type
- `GET /analytics/incidents-by-region` — incident counts grouped by region and type
- `GET /analytics/resource-utilization` — dispatch counts by unit type + live resource counts
- `GET /analytics/dashboard` — aggregate summary (total, active, resolved, avg response time)

---

## Phase 2: Backend Implementation

### auth-service

**Files created:**
- `src/index.js` — Express app entry point; connects to PostgreSQL, syncs models, starts HTTP server
- `src/config/database.js` — Sequelize connection using environment variables
- `src/models/User.js` — User model with UUID PK, bcrypt password hash, role enum, refresh token storage
- `src/middleware/auth.js` — `authenticate` middleware (JWT verification) and `authorize` (role-based guard)
- `src/routes/auth.js` — All auth endpoints; JWT access token (1h expiry) + refresh token (7d expiry)
- `package.json` — Dependencies: express, sequelize, pg, bcryptjs, jsonwebtoken, cors, morgan
- `Dockerfile` — Node 18 Alpine image

**Key implementation details:**
- Passwords hashed with bcrypt (12 salt rounds)
- Access tokens expire in 1 hour; refresh tokens in 7 days
- Refresh tokens stored in DB per user; rotated on each refresh
- Role enum enforced at DB level via Sequelize ENUM type

---

### resource-service

**Files created:**
- `src/index.js` — Express app, mounts all resource routers
- `src/config/database.js` — Sequelize PostgreSQL connection
- `src/models/index.js` — Hospital, Ambulance, PoliceStation, FireStation models; Hospital hasMany Ambulances association
- `src/middleware/auth.js` — JWT verification (shared secret); role-based authorization
- `src/routes/hospitals.js` — CRUD for hospitals + `POST /nearest` using Haversine distance
- `src/routes/ambulances.js` — CRUD for ambulances + `POST /nearest` to find closest available unit
- `src/routes/police.js` — CRUD for police stations + `POST /nearest`
- `src/routes/fire.js` — CRUD for fire stations + `POST /nearest`
- `package.json`, `Dockerfile`

**Key implementation details:**
- Haversine formula implemented in each route module for geographic distance calculation
- `POST /*/nearest` endpoints are unauthenticated (called internally by incident-service)
- Ambulance `status` field: `available`, `dispatched`, `maintenance`
- Hospital ↔ Ambulance association allows eager-loading of ambulances with hospital queries

---

### incident-service

**Files created:**
- `src/index.js` — Express app; connects DB, starts MQ publisher, starts HTTP server
- `src/config/database.js` — Sequelize PostgreSQL connection
- `src/models/Incident.js` — Full incident model with status lifecycle, assignment fields, response time tracking
- `src/middleware/auth.js` — JWT verification and role guard
- `src/routes/incidents.js` — All incident endpoints including auto-dispatch on creation
- `src/services/dispatchService.js` — Calls resource-service to find nearest responder by incident type
- `src/messaging/publisher.js` — RabbitMQ publisher; connects with retry logic; publishes to 3 queues
- `package.json`, `Dockerfile`

**Key implementation details:**
- On `POST /incidents`, the service immediately calls `dispatchService.findNearestResponder()` which routes to the correct resource endpoint based on incident type
- Medical/accident → ambulance; Crime → police station; Fire → fire station; Other → police station
- Response time is calculated in minutes when status is set to `resolved`
- MQ publisher uses persistent messages and durable queues for reliability
- Retry logic: if RabbitMQ is unavailable at startup, retries every 5 seconds

---

### dispatch-service

**Files created:**
- `src/index.js` — HTTP + WebSocket server (Socket.io); JWT auth on socket connections
- `src/config/database.js` — Sequelize PostgreSQL connection
- `src/models/Vehicle.js` — Vehicle model with type, station, incident, driver, GPS, and status fields
- `src/models/LocationHistory.js` — Append-only GPS history log per vehicle
- `src/middleware/auth.js` — JWT middleware for REST endpoints
- `src/routes/vehicles.js` — All vehicle and location endpoints; emits WebSocket events on location update
- `src/messaging/consumer.js` — Listens to `incident.dispatched` queue; updates vehicle status to `responding`
- `package.json`, `Dockerfile`

**Key implementation details:**
- Socket.io server runs on the same port as HTTP (3004) using `http.createServer`
- Socket connections require `auth.token` (JWT) in handshake — unauthenticated sockets are rejected
- Clients can call `socket.emit('subscribe_incident', incidentId)` to join an incident room
- Every `PUT /vehicles/:id/location` call: updates vehicle record, writes to `LocationHistory`, and broadcasts `location_update` event to all WebSocket clients
- `vehicle_dispatched` event is emitted via WebSocket when a dispatch MQ message is received

---

### analytics-service

**Files created:**
- `src/index.js` — Express app; connects DB, starts MQ consumer, starts HTTP server
- `src/config/database.js` — Sequelize PostgreSQL connection
- `src/models/IncidentSnapshot.js` — Local analytics copy of incident data; updated via MQ events
- `src/middleware/auth.js` — JWT verification
- `src/routes/analytics.js` — All analytics endpoints using Sequelize aggregate functions
- `src/messaging/consumer.js` — Listens to all 3 incident queues; maintains `IncidentSnapshot` table
- `package.json`, `Dockerfile`

**Key implementation details:**
- Uses event-driven data ingestion: analytics data is populated via RabbitMQ, not direct DB queries to other services
- Region classification based on Ghana latitude ranges (Northern, Ashanti, Greater Accra, Southern)
- `GET /analytics/resource-utilization` also fetches live data from resource-service via HTTP for current counts
- All aggregate queries use Sequelize `fn()` and `col()` for `AVG`, `MIN`, `MAX`, `COUNT`

---

### Infrastructure

**docker-compose.yml:**
- 5 PostgreSQL 15 instances (ports 5432–5436), each with named volume for persistence
- RabbitMQ 3 with management plugin (AMQP on 5672, dashboard on 15672)
- All 5 microservice containers with environment variables for DB connections, JWT secret, RabbitMQ URL, and inter-service URLs
- All services on a shared `emergency-network` bridge network
- `restart: unless-stopped` on all microservices

**Shared conventions across all services:**
- JWT secret: `emergency_jwt_secret_key_2024` (via environment variable)
- All services use `sequelize.sync({ alter: true })` on startup for schema migrations
- All services use `morgan` for HTTP request logging
- All services expose `GET /health` for liveness checks
- CORS enabled on all services

---

## File Tree

```
emergency-response-platform/
├── docker-compose.yml
├── README.md
├── changelog/
│   └── CHANGELOG.md
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/client.js
│       ├── contexts/AuthContext.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   └── ProtectedRoute.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── DispatchStatus.jsx
│           ├── NewIncident.jsx
│           ├── VehicleTracking.jsx
│           └── Analytics.jsx
├── auth-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js
│       ├── config/database.js
│       ├── models/User.js
│       ├── middleware/auth.js
│       └── routes/auth.js
├── resource-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js
│       ├── config/database.js
│       ├── models/index.js
│       ├── middleware/auth.js
│       └── routes/
│           ├── hospitals.js
│           ├── ambulances.js
│           ├── police.js
│           └── fire.js
├── incident-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js
│       ├── config/database.js
│       ├── models/Incident.js
│       ├── middleware/auth.js
│       ├── routes/incidents.js
│       ├── services/dispatchService.js
│       └── messaging/publisher.js
├── dispatch-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js
│       ├── config/database.js
│       ├── models/
│       │   ├── Vehicle.js
│       │   └── LocationHistory.js
│       ├── middleware/auth.js
│       ├── routes/vehicles.js
│       └── messaging/consumer.js
└── analytics-service/
    ├── Dockerfile
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js
        ├── config/database.js
        ├── models/IncidentSnapshot.js
        ├── middleware/auth.js
        ├── routes/analytics.js
        └── messaging/consumer.js
```
