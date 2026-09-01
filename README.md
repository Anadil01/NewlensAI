# HN Insight Hub

A full-stack MERN application that scrapes top stories from Hacker News and allows authenticated users to bookmark stories.

## Features

- Hacker News scraping using Axios + Cheerio
- JWT Authentication
- User Registration/Login
- Bookmark stories
- Protected routes
- REST APIs
- Responsive React frontend

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- JWT
- Cheerio

### Frontend
- React
- React Router DOM
- Axios
- Context API

## Installation

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend

```env
PORT=5001
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
```

### Frontend

```env
VITE_API_URL=http://localhost:5001/api
```

## Deployment

- Frontend deployed on Vercel
- Backend deployed on Render

## Author

Anadil




Metrics we can add to NewslensAI
I would target these:
Area	Metric we can measure
Ingestion	Stories processed per run
Processing	Pipeline completion time
Extraction	Successful extraction rate
AI	Summaries generated / success rate
AI	Average summarization latency
Queue	Jobs processed / failed
Elasticsearch	Search response latency
API	Average API response time
Database	Stories persisted per run
Deduplication	Duplicate stories prevented
Reliability	Retry/success rate
Performance	Concurrent jobs supported
Caching	Cache hit rate


For example, after measuring your current system, your resume could eventually say something like:
Built an AI-powered news intelligence platform processing 100+ stories per ingestion cycle through a BullMQ-based asynchronous pipeline, achieving 95%+ processing reliability with automated retries.

Or:
Implemented Elasticsearch-powered story search with sub-200ms query latency across 10K+ indexed stories.

But we shouldn't claim those numbers yet.
What I want to do with the project
Instead of manually guessing metrics, let's add a small metrics/observability layer to NewslensAI.
Your pipeline could output something like:
==============================
NewslensAI Pipeline Metrics
==============================

Stories fetched:       10
Extraction success:    7/10 (70%)
Summaries generated:   10/10 (100%)
Topics classified:     10/10 (100%)
Bias analyzed:         7/10 (70%)

Pipeline duration:     42.8s

Average extraction:    1.8s
Average AI summary:    3.2s
Average classification:0.9s

Queue retries:         1
Failed jobs:            0
Then we run the system with larger batches:
25 stories
50 stories
100 stories
and measure it.
That gives you real engineering metrics, rather than resume decoration.
Metrics I'd specifically build for your resume
1. Pipeline throughput
Measure:
stories / minute
Example:
50 stories / 2.5 minutes
= 20 stories/min
Resume:
Built an asynchronous Python ingestion pipeline processing 50+ news stories per run using BullMQ and Redis-backed job orchestration.

2. Processing reliability
Your BullMQ configuration already has:
attempts: 3
and:
backoff: {
    type: "exponential",
    delay: 5000
}
That's useful.
We can measure:
successful jobs
failed jobs
retried jobs
Then potentially say:
Implemented BullMQ-based asynchronous processing with 3-attempt exponential backoff, improving ingestion reliability and preventing API requests from blocking during AI processing.

That's a stronger resume statement than simply saying "used BullMQ."
3. Search performance
You already have:
Elasticsearch
So we'll benchmark:
10,000 stories
50,000 stories
100,000 stories
and measure:
average search latency
p95 latency
For example, if your actual benchmark gives:
Average: 82ms
P95: 145ms
then we can write:
Implemented Elasticsearch-powered full-text search across 50K+ stories with ~82ms average query latency.

That's a very good resume metric.
4. AI pipeline
You have:
Summarization
Topic Classification
Bias Detection
We can measure:
stories analyzed
AI success rate
average processing time
fallback rate
For example, if we actually measure:
100 stories
96 successful
4 fallback

96% success rate
Then:
Built an AI enrichment pipeline generating summaries, topic classifications and bias analysis for 100+ articles with 96% successful processing.

5. Content extraction
Your current run already gives us:
10 stories
7 successful
3 failed
So currently:
7 / 10 = 70%
But that's actually useful because it shows us something we need to improve.
We should fix the Hacker News URLs and then benchmark again.
Goal:
Before:
70%

After:
95%+
Then we have a real before/after metric.
For example:
Improved article extraction success rate from 70% to 95%+ by normalizing Hacker News URLs and adding extraction fallbacks.

That is much more powerful.
6. Database scale
Don't just say:
Used PostgreSQL.

Instead, eventually have something like:
Stories:       25,000
Summaries:     24,800
Topics:        40,000+
Bias analyses: 20,000+
Then your resume can demonstrate that you actually tested the application at meaningful scale.
7. API performance
We can benchmark your Node APIs:
GET /api/stories
GET /api/stories/:id
GET /api/stories/search
using something like:
autocannon
and record:
requests/sec
average latency
p95 latency
Example:
GET /api/stories

Requests/sec: 850
Average latency: 12ms
P95: 24ms
Then you have another genuine metric.
The final resume project could look like this
After we actually measure everything, something along these lines:
NewslensAI — AI-Powered News Intelligence Platform
- Built a full-stack news intelligence platform using React, Node.js, PostgreSQL, Redis, Elasticsearch and Python, processing X+ articles per ingestion cycle through an asynchronous BullMQ pipeline.
- Engineered an AI enrichment pipeline for summarization, topic classification, story clustering and bias detection, achieving X% processing success rate across X+ articles.
- Implemented Elasticsearch-powered full-text search over X+ indexed stories, achieving Xms average / Xms P95 search latency.
- Designed Redis + BullMQ job processing with 3-attempt exponential retries, reducing request blocking and improving ingestion reliability to X% successful jobs.
Those are ATS-friendly, technical, and measurable.