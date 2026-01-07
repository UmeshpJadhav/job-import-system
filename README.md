# Scalable Job Import System (MERN)

A robust, queue-based system for importing job feeds from external XML sources into MongoDB. Designed for high scalability and fault tolerance.

## 🚀 Features
- **Scalable Architecture:** Uses Redis Queue to decouple fetching from processing.
- **High Performance:** Implements MongoDB `bulkWrite` for batch upserts (capable of handling 1M+ records).
- **Resilience:** Automatic retries and error logging.
- **Monitoring:** Real-time Admin Dashboard to track import history.
- **Configurable:** Concurrency and batch sizes adjustable via environment variables.

## 🛠 Tech Stack
- **Frontend:** Next.js 14, TailwindCSS, Lucide Icons.
- **Backend:** Node.js, Express, BullMQ (Redis), Mongoose.
- **Tools:** Docker (optional for Redis/Mongo), Fast-XML-Parser.

## 📋 Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or Atlas URI)
- Redis (Running locally or Cloud)

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd server
npm install
npm start
```
*Server runs on http://localhost:5000*
*Note: Ensure Redis is running on localhost:6379 or update .env*

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Client runs on http://localhost:3000*

## 🧪 Testing
- **Manual Trigger:** Go to the Dashboard and click "Trigger Import".
- **Cron Job:** The system is configured to auto-run every 1 hour (see `server/index.js`).

## 📁 Project Structure
- `/server/src/services`: XML Fetching logic.
- `/server/src/queue`: BullMQ Producer and Worker.
- `/server/src/models`: DB Schemas.
- `/client/src/app`: Next.js functionality.

## 🔍 Assumptions
- The "Jobicy" XML feed format is standard RSS 2.0 but may vary slightly; logic is adaptable.
- "Unique Job" is identified by its `link` (Source URL).
