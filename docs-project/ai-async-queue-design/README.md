# AI Async Processing & Queue Design

## Overview
This document describes the step-by-step plan to implement asynchronous AI processing with queue management for pre-bid queries. The goal is to provide a scalable, user-friendly experience with real-time status updates and queue position/ETA feedback.

---

## 1. Entity & Database Changes
- **Add new fields to the Query entity:**
  - `aiStatus: string` (e.g., 'queued', 'processing', 'completed', 'failed')
  - `queuePosition: number | null`
  - `estimatedCompletionTime: Date | null`
- **Migration:**
  - Create a DB migration to add these fields to the queries table.

---

## 2. Queue Infrastructure
- **Choose a queue system:**
  - For Node.js/NestJS: Use [BullMQ](https://docs.bullmq.io/) (Redis-backed) or a simple in-memory queue for POC.
- **Create a queue for AI jobs:**
  - Each job represents a query to be processed by the AI.
- **Queue Worker:**
  - A background worker/service listens for jobs and processes them sequentially or in parallel (configurable).

---

## 3. Backend Service Changes
- **On process request:**
  - Set `aiStatus = 'queued'`, add job to queue, return immediately with status and queue position.
- **Worker logic:**
  - When a job is picked:
    - Set `aiStatus = 'processing'`, update queue position for all jobs.
    - Call the AI/Chief Engineer Agent.
    - On success: set `aiStatus = 'completed'`, save `aiResponse`, clear queue position/ETA.
    - On failure: set `aiStatus = 'failed'`, log error.
- **Queue position/ETA:**
  - Calculate queue position as the index in the queue.
  - Estimate completion time based on average job duration.

---

## 4. API & Controller Changes
- **Expose new fields:**
  - Return `aiStatus`, `queuePosition`, and `estimatedCompletionTime` in all relevant endpoints (get query, process query, etc).
- **Polling endpoint:**
  - Frontend can poll `/api/queries/:id` to get live status and response.

---

## 5. Frontend Changes
- **Show status:**
  - Display messages for 'queued', 'processing', 'completed', 'failed'.
- **Auto-refresh:**
  - Poll the query endpoint every few seconds until `aiStatus` is 'completed' or 'failed'.
- **Show queue position/ETA:**
  - Display queue position and estimated time if available.

---

## 6. Error Handling & Edge Cases
- **Timeouts:**
  - Set max processing time per job; mark as 'failed' if exceeded.
- **Retries:**
  - Optionally retry failed jobs.
- **Manual re-trigger:**
  - Allow admin to re-queue failed jobs.

---

## 7. Rollback & Backups
- **Backup all modified files before changes.**
- **Migration scripts should be reversible.**

---

## 8. Monitoring & Logging
- **Log all queue events, errors, and status changes.**
- **Expose metrics for queue length, average processing time, etc.**

---

## 9. Optional Enhancements
- **Priority queue:**
  - Allow urgent queries to jump the queue.
- **WebSocket notifications:**
  - Push status updates to frontend in real time.

---

## 10. Testing
- **Unit and integration tests for queue logic, status updates, and API responses.**

---

## References
- [BullMQ Docs](https://docs.bullmq.io/)
- [NestJS Bull Integration](https://docs.nestjs.com/techniques/queues)
