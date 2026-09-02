# Metrics & Benchmarking Plan

Working notes, moved out of `README.md` so the README can describe the project as it
actually is. Nothing here is measured yet — these are targets and a measurement plan.

**None of the numbers below are real.** They are illustrative examples of the shape of
metric we want. Do not put any of them on a resume until the benchmark has actually run.

---

## What to measure

| Area | Metric |
|------|--------|
| Ingestion | Stories processed per run |
| Processing | Pipeline completion time |
| Extraction | Successful extraction rate |
| AI | Summaries generated / success rate |
| AI | Average summarization latency |
| Queue | Jobs processed / failed / retried |
| Elasticsearch | Search response latency (avg, p95) |
| API | Average API response time |
| Database | Stories persisted per run |
| Deduplication | Duplicate stories prevented |
| Reliability | Retry / success rate |
| Performance | Concurrent jobs supported |
| Caching | Cache hit rate |

## Proposed pipeline metrics output

Rather than guessing, add a small metrics/observability layer so `run_pipeline.py`
emits something like:

```
==============================
NewsLensAI Pipeline Metrics
==============================

Stories fetched:       10
Extraction success:    7/10 (70%)
Summaries generated:   10/10 (100%)
Topics classified:     10/10 (100%)
Bias analyzed:         7/10 (70%)

Pipeline duration:     42.8s

Average extraction:    1.8s
Average AI summary:    3.2s
Average classification: 0.9s

Queue retries:         1
Failed jobs:           0
```

Then run with progressively larger batches — 25, 50, 100 stories — and record results.

## Benchmarks to run

1. **Pipeline throughput** — stories/minute across batch sizes.
2. **Processing reliability** — successful vs failed vs retried jobs. The BullMQ config
   already sets `attempts: 3` with exponential backoff at 5000ms, so the retry path is
   real and measurable.
3. **Search performance** — Elasticsearch avg and p95 latency at 10K / 50K / 100K stories.
4. **AI pipeline** — stories analyzed, success rate, average processing time, fallback rate.
5. **Content extraction** — a real before/after. An early manual run extracted 7 of 10
   successfully; the suspected cause is Hacker News URLs pointing at discussion pages
   rather than articles. Fix, then re-benchmark, and the improvement is a genuine metric.
6. **Database scale** — row counts for stories, summaries, topics, bias analyses, to show
   the system was exercised at a meaningful size.
7. **API performance** — `autocannon` against `GET /api/stories`, `/api/stories/:id`, and
   `/api/stories/search`; record req/sec, average latency, p95.

## Resume framing (once measured)

The value of these is that each is falsifiable and tied to a design decision, not
decoration. Fill the placeholders only from real benchmark output:

- Built a full-stack news intelligence platform (React, Node.js, PostgreSQL, Redis,
  Elasticsearch, Python) processing _X_ articles per ingestion cycle through an
  asynchronous BullMQ pipeline.
- Engineered an AI enrichment pipeline for summarization, topic classification, story
  clustering and bias detection, achieving _X_% processing success across _X_ articles.
- Implemented Elasticsearch full-text search over _X_ indexed stories at _X_ ms average /
  _X_ ms p95 latency.
- Designed Redis + BullMQ job processing with 3-attempt exponential retries, keeping
  ingestion off the request path and reaching _X_% successful jobs.
