# Emergency Response Platform

A distributed microservices-based national emergency response and dispatch coordination system.

## Services

| Service | Port | Description |
|---------|------|-------------|
| auth-service | 3001 | Identity & Authentication |
| resource-service | 3002 | Hospitals, Police, Fire Stations |
| incident-service | 3003 | Emergency Incidents |
| dispatch-service | 3004 | Vehicle Tracking (WebSocket) |
| analytics-service | 3005 | Analytics & Monitoring |

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)

## Quick Start

```bash
cd emergency-response-platform
docker-compose up --build
```

## API Overview

### Auth Service (port 3001)
- POST /auth/register
- POST /auth/login
- POST /auth/refresh-token
- GET /auth/profile

### Resource Service (port 3002)
- GET/POST /hospitals
- GET/POST /ambulances
- GET/POST /police-stations
- GET/POST /fire-stations

### Incident Service (port 3003)
- POST /incidents
- GET /incidents/:id
- GET /incidents/open
- PUT /incidents/:id/status
- PUT /incidents/:id/assign

### Dispatch Service (port 3004)
- POST /vehicles/register
- GET /vehicles
- GET /vehicles/:id/location
- PUT /vehicles/:id/location (location update)
- WebSocket: ws://localhost:3004

### Analytics Service (port 3005)
- GET /analytics/response-times
- GET /analytics/incidents-by-region
- GET /analytics/resource-utilization
- GET /analytics/dashboard

## Message Queues (RabbitMQ)

- `incident.created` - fired when a new incident is created
- `incident.dispatched` - fired when a responder is assigned
- `incident.resolved` - fired when an incident is resolved

## Roles

- `system_admin` - can create incidents, manage all resources
- `hospital_admin` - manages hospital and ambulance data
- `police_admin` - manages police station data
- `fire_admin` - manages fire station data
- `ambulance_driver` - can update location/status
