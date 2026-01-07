# Scalable Job Import System 
This is a full-stack MERN application that fetches job data from external XML feeds, normalizes it, and processes it in the background.

##  Why I Built This
Fetching data is easy. Fetching **large** data consistently, handling errors, and not creating duplicates is hard. I wanted to design a system that is:
1.  **Resilient**: If an API fails, it retries automatically.
2.  **Scalable**: It uses a Queue (Redis) so it doesn't matter if 1 feed or 1,000 feeds come in at once.
3.  **User-Friendly**: You shouldn't have to check logs to see if it worked. I built a Real-Time Dashboard for that.

##  How It Works (The "Secret Sauce")
Instead of processing imports in the main API loop, I offload them to a background **Worker**. 
*   **Queue**: I use **BullMQ** (Redis) to manage tasks.
*   **Optimization**: I use MongoDB `bulkWrite` operations. This allows me to insert/update 500 records in a single database call, making it incredibly fast.
*   **Real-Time**: I implemented **Socket.IO** so the dashboard updates instantly (Pending -> Processing -> Completed) without you needing to refresh the page.

##  Tech Stack
*   **Frontend**: Next.js 14, TailwindCSS (Responsive Design)
*   **Backend**: Node.js, Express
*   **Database**: MongoDB (with Mongoose)
*   **Queue**: Redis + BullMQ
*   **Dev Tools**: Fast-XML-Parser, Socket.IO

##  How to Run It

### 1. Prerequisites
You need **Node.js**, **MongoDB**, and **Redis** installed.

### 2. Setup Backend
```bash
cd server
npm install
npm start
```
*The server runs on port 5000.*

### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```
*The client runs on port 3000.*

##  Try It Out
1.  Open the Dashboard at `http://localhost:3000`.
2.  Click **"Trigger Import"**.
3.  Watch the status update live! 

