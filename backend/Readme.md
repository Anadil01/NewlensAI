
Q1 - How do you handle errors in Express?" 
# "I use centralized error-handling middleware instead of handling responses independently in every controller. Controllers or services pass errors to Express using next(error), and the centralized middleware determines the appropriate HTTP status and response. I also distinguish expected operational errors from unexpected system errors and avoid exposing internal details in production."


Created:
backend/utils/asyncHandler.js

Purpose:
Catch rejected promises from async controllers
and pass errors to Express using next(error).


# Never trust data coming from the client. -- A client can send anything.

# Elasticsearch-

                  ┌──────────────┐
                  │ PostgreSQL   │
                  │ Source Truth │
                  └──────┬───────┘
                         │
                         │ sync
                         ▼
                  ┌──────────────┐
                  │ Elasticsearch│
                  │ Search Index │
                  └──────┬───────┘
                         │
                         ▼
                    Search API


"PostgreSQL is our source-of-truth relational database, while Elasticsearch maintains a denormalized search index optimized for full-text search and relevance ranking."


Search request flow

GET /api/stories/search?q=react
                │
                ▼
        Search Controller
                │
                ▼
         Search Service
                │
                ▼
        Elasticsearch
                │
                ▼
       ranked story IDs
                │
                ▼
          PostgreSQL
                │
                ▼
        complete stories
                │
                ▼
             Redis
                │
                ▼
            Response



                    NewsLens Backend
                          │
          ┌───────────────┼────────────────┐
          ↓               ↓                ↓
     PostgreSQL          Redis       Elasticsearch
       Prisma            Cache           Search
       Source           Speed          Full-text
       Truth