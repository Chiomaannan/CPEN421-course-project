# Changelog

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
