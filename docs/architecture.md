# How I Built This System

Here's a look at the architecture and why I made specific design choices for this Job Import System.

## Why I Built It This Way

### 1. Decoupling with Redis (Producer-Consumer)
I didn't want the user to wait for the import to finish.
Instead of processing everything in the API request, I simply **queue** the work. The API responds instantly with "Job Queued", and a background worker handles the heavy lifting. This keeps the app snappy and responsive..

### 2. Sequential Processing (Solving the 429 Error)
At first, I processed all 9 feeds in parallel. It was fast, but `jobicy.com` immediately blocked my IP (`429 Too Many Requests`).
**My Fix:** I configured the worker to process **one job at a time** (`concurrency: 1`) with a 2-second rate limit. It's slower (takes ~30 seconds), but it works 100% of the time. Reliability > Speed.

### 3. Granular "Per-URL" Tracking
A single "Batch Failed" error is useless.
I split the import into **9 separate jobs**. Now, if the Data Science feed fails, you know exactly which one it is, while the other 8 succeed. This makes debugging trivial.

### 4. Robustness: "Zombie Processes" & Queue Isolation
During development, I had old worker processes stuck in the background causing errors like `urls is not iterable` even though the new code used `url` (singular).
**My Fix:** I renamed the queue from `import-queue` to `feed-import-queue`. This instantly cut off the old processes and routed all traffic to the correct worker code.

### 5. Self-Healing UI
WebSockets are great for real-time updates, but they can disconnect (firewalls, network blips, etc.).
I added a **polling fallback**. If the UI sees a job is "Processing", it double-checks with the API every 3 seconds. The user never sees a stuck spinner, even if Socket.IO dies.

---

## Database Design

### Job Collection
- Stores the actual job listings fetched from feeds
- Uses `bulkWrite` with `upsert: true` to insert/update in batches of 100
- Unique index on `sourceUrl` prevents duplicates across re-imports
- Much faster than saving jobs one-by-one (handles thousands per second)

### ImportLog Collection
Tracks the history of every import run:
- **Metrics:** Total fetched, New jobs, Updated jobs, Failed jobs
- **Status:** Tracks lifecycle (Pending → Processing → Completed/Failed)
- **Errors:** Stores failure reasons for debugging
- **Timestamps:** Full audit trail of when things happened
- **Source URL:** Which feed this log entry belongs to

This gives you a complete picture of what happened during each import, making it easy to spot patterns (e.g., "The SMM feed fails every Tuesday").

---

## Architecture Diagram
```
User clicks "Trigger"
        ↓
    API Server
        ↓
  [Queue 9 Jobs] → Redis (BullMQ)
        ↓
    Worker (picks jobs one-by-one)
        ↓
    Fetch XML → Parse → Validate
        ↓
    MongoDB (bulkWrite)
        ↓
    Update ImportLog
        ↓
    Emit Socket.IO event → Frontend
        ↓
    Dashboard updates in real-time
```

---

## Key Learnings

1. **Rate Limits Are Real:** Don't hammer external APIs. Be polite.
2. **Visibility Matters:** Per-job tracking made debugging 10x easier.
3. **Always Have a Fallback:** Socket.IO + Polling = bulletproof updates.
4. **Test in Production:** The zombie process bug only appeared during hot reloads with nodemon.
5. **Document Your Journey:** Writing this helped me understand my own decisions better.

---

## Future Optimizations

If I had more time, here's what I'd add:

1. **Per-Domain Parallelization**
   - Current: All feeds sequential (30s total)
   - Improved: Group by domain, process domains in parallel
   - Result: ~10-15 seconds instead of 30

2. **Smarter Retry Logic**
   - Retry 429 errors with exponential backoff
   - Don't retry 404s (feed permanently gone)
   - Alert on repeated failures

3. **Performance Monitoring**
   - Track fetch time per feed
   - Identify slow feeds
   - Historical trend graphs

4. **Unit Tests**
   - Mock external APIs
   - Test upsert logic
   - Verify rate limiting works