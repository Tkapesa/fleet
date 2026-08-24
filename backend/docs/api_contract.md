# API Contract - Frontend

Endpoints relevant to frontend map, alerts, telemetry, geofences, and maintenance cards.

Alerts
- GET /alerts/?limit=100
  - Response: list of alerts with fields: id, title, message, severity, truck_id, driver_id, route_id, metadata_json, created_at, acknowledged
- POST /alerts/{id}/ack
  - Body: { acknowledged_by_user_id: int }
  - Response: 200 on success
- GET /alerts/summary
  - Response: { total: int, by_severity: {critical: int, warning: int, info: int} }

Telemetry
- POST /telemetry/trucks/{truck_id}/heartbeat
  - Body: { latitude: float, longitude: float, speed_kph: float, heading_degrees: float, odometer_km: float, ignition_on: bool, recorded_at: ISO8601 }
  - Response: TelemetryEvent object persisted
- GET /telemetry/trucks/{truck_id}/history?limit=100
  - Response: list of TelemetryEvent objects (for map playback)

Geofences
- GET /geofences/
- POST /geofences/
  - Body: { name, center_latitude, center_longitude, radius_meters, truck_id?, is_active }
- POST /geofences/evaluate?truck_id={truck_id}
  - Response: { truck_id, breaches: [{ geofence_id, distance_meters, radius_meters }] }

Maintenance Schedules
- GET /maintenance-schedules/?truck_id={truck_id}
- POST /maintenance-schedules/
  - Body: { truck_id, service_type, interval_days?, interval_km?, last_service_date?, last_service_km? }
- POST /maintenance-schedules/check-due
  - Response: { due_alerts_created: int }

Routes and Hazards
- POST /routes/ (create route)
  - Response includes `hazard_score` and `hazard_details` produced by `assess_route_hazards`
- GET /routes/{route_id}/hazards
  - Response: HazardAssessmentRead { risk_level, summary, hazards, provider_details }

Notes
- Use `GET` polling or WebSocket for real-time alerts and telemetry map updates.
- For map display, use `telemetry_history` for playback and `alerts` for annotations.
- Respect `company_id` scoping: API returns company-scoped results for authenticated users.
