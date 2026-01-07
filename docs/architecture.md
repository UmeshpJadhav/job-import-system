# System Architecture: Scalable Job Import System

## Overview
This system is designed to import job listings from external XML feeds, process them asynchronously, and store them in a MongoDB database. It is built to simulate a high-scale environment capable of handling millions of records efficiently.

## Core Components

### 1. Job Fetcher Service (`/server/src/services/jobFetcher.js`)
- **Responsibility:** Connects to external XML APIs, parses the response, and normalizes data into a standard JSON format.
- **Library Choice:** `fast-xml-parser` is used for low-memory overhead parsing compared to DOM-based parsers.

### 2. Queue Architecture (Redis + BullMQ)
- **Problem:** Processing 1 million records synchronously would block the event loop and time out HTTP requests.
- **Solution:** Separation of concerns.
  - **Producer:** The Cron job pushes a light "Fetch Job" (containing the URL) to the Redis queue.
  - **Consumer (Worker):** Pickups the job and performs the heavy lifting (fetching, parsing, DB writing).
- **Concurrency:** Configurable via `JOB_CONCURRENCY` env var. This allows horizontal scaling (running multiple worker nodes).

### 3. Database Strategy (MongoDB)
- **Schema Design:**
  - `Job`: Indexed by `sourceUrl` (Unique). This is the key for deduplication.
  - `ImportLog`: Tracks the state of every run (Total, New, Failed).
- **Optimization - Bulk Operations:**
  - Instead of inserting jobs one-by-one (`findOne` + `save`), the worker processes jobs in batches (e.g., 500 at a time).
  - It uses `Job.bulkWrite()` with `updateOne({ upsert: true })`.
  - **Impact:** Reduces database round-trips by 500x. This is the single most critical decision for hitting the "1 million records" target.

### 4. Admin Dashboard (Next.js)
- A lightweight UI that polls the API for Real-time status of import runs.
- Built with React Server Components (App Router) for efficiency.

## Data Flow Diagram
```mermaid
graph TD
    Cron[Cron Job / Trigger] -->|Push Job| Redis[(Redis Queue)]
    Redis -->|Pull Job| Worker[Worker Service]
    
    subgraph Worker Process
        Worker -->|HTTP Get| ExternalAPI[External XML Feed]
        ExternalAPI -->|XML Data| Worker
        Worker -->|Parse & Batch| Batch[Job Batch (500)]
        Batch -->|BulkUpsert| MongoDB[(MongoDB)]
    end
    
    Worker -->|Update Status| ImportLog[ImportLog Collection]
    Client[Next.js Dashboard] -->|Poll Status| API[Express API]
    API -->|Read| ImportLog
```

## Resilience & Reliability
- **Retries:** BullMQ handles automatic retries for failed network requests.
- **Atomic Log Updates:** Metrics are updated transactionally where possible to ensure the "Total Imported" count is accurate.
- **Error Tracking:** Every failure is logged with a timestamp and reason in the `ImportLog`.
