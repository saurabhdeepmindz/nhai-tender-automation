# AI Async Queue - API & Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend as "Frontend (localhost:3000)"
    participant Swagger as "Swagger UI (localhost:3001)"
    participant API as "NestJS API (localhost:3001)"
    participant Queue as "AI Job Queue (BullMQ/Redis)"
    participant Worker as "AI Worker Service"
    participant Chief as "Chief Engineer Agent (localhost:8001)"

    User->>Frontend: Submit Query (UI)
    Frontend->>API: POST /api/queries (localhost:3001)
    API-->>Frontend: Query Created (aiStatus: pending)
    User->>Swagger: POST /api/queries/:id/process (localhost:3001)
    Swagger->>API: POST /api/queries/:id/process
    API->>Queue: Add AI Job (aiStatus: queued)
    API-->>Swagger: 202 Accepted (aiStatus: queued, queuePosition, ETA)
    Note right of User: User sees 'Processing' message
    loop Polling
        Frontend->>API: GET /api/queries/:id
        API-->>Frontend: aiStatus: queued/processing/completed, queuePosition, ETA
    end
    Queue->>Worker: Dequeue AI Job
    Worker->>API: Update aiStatus: processing
    Worker->>Chief: POST /api/chief-engineer/process (localhost:8001)
    Chief-->>Worker: AI Response
    Worker->>API: Update aiStatus: completed, aiResponse
    API-->>Frontend: aiStatus: completed, aiResponse
    Note right of User: User sees AI response
```

---

- All API endpoints and ports are shown as actually called in the system.
- The queue and worker can be implemented with BullMQ/Redis or similar.
- Polling is used for status updates; WebSocket can be added for real-time push.
