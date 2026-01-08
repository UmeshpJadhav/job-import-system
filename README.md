# Scalable Job Import System 🚀

A full-stack job importer that pulls listings from multiple RSS/XML feeds and stores them in MongoDB. Built this to handle rate limits, network failures, and give you real-time visibility into what's actually happening.

## What It Does

Imports job listings from 9 different feeds (Jobicy + HigherEdJobs), processes them in the background using Redis queues, and shows you a live dashboard of what's going on. Each feed gets tracked separately so you can see exactly which ones worked and which ones failed.

## 🛠️ Tech Stack
*   **Frontend:** Next.js 14, TailwindCSS.
*   **Backend:** Node.js, Express.
*   **Queue:** BullMQ + Redis
*   **Database:** MongoDB (Mongoose).
*   **Real-time:** Socket.IO.

## Quick Start

### What You Need
- Node.js 18+
- MongoDB running somewhere
- Redis (local or cloud)

### 1. Check Everything's Running
Ensure Redis and MongoDB are running:
```bash
redis-cli ping # Should return PONG
mongosh # Should connect
```

### 2. Backend Setup
```bash
cd server
npm install
# Create .env file (see .env.example)
npm start
```
*   Server runs on `http://localhost:5000`
*   **Note:** The server handles both the API and the Background Worker.

### 3. Frontend Setup
```bash
cd client
npm install
# Create .env file (see .env.example)
npm run dev
```
*   Client runs on `http://localhost:3000`

---

Dashboard opens at `http://localhost:3000`

## How to Use It

1. Go to `http://localhost:3000`
2. Hit the "Trigger Import" button
3. Watch the dashboard update as jobs process

You'll see 9 rows (one per feed) go through:
- **Pending** → job's queued up
- **Processing** → worker is fetching the data right now
- **Completed** → done, check the New/Updated counts
- **Failed** → something broke (check logs)

---

## 📂 Project Structure

```
/client                 # Next.js Frontend
  /src/app/page.tsx     # Main Dashboard (Real-time + Polling)
  /src/components       # Reusable UI components

/server                 # Node.js Backend
  /src/config/feeds.js  # Configuration of Feed URLs
  /src/controllers      # API Logic (Trigger, History)
  /src/queue/worker.js  # The Background Processor (Logic resides here)
  /src/queue/producer.js# Adds jobs to the Redis Queue
  /src/models           # Mongoose Schemas (Job, ImportLog)
  index.js              # Entry point (Server + Cron + Socket.IO)
```

Built this for a coding challenge. It's not perfect but it handles real-world problems like rate limiting and network failures pretty well.