                    ┌──────────────┐
                    │   Frontend   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Express   │
                    │     API      │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌──────────────┐          ┌──────────────┐
       │    Redis     │          │  PostgreSQL  │
       │              │          │              │
       │ Fast / cache │          │ Source truth │
       └──────────────┘          └──────────────┘
    
# PostgreSQL- 
- "I permanently own the data."

# Redis-
- I temporarily keep frequently needed data so we don't repeatedly ask PostgreSQL or external services.

- Why NewsLens needs Redis :-
  Consider this endpoint:
   GET /api/stories
 Suppose 1,000 users open NewsLens.
 Without caching:
 1000 requests
      ↓
1000 PostgreSQL queries
      ↓
1000 responses
With Redis:
1000 requests
      ↓
Redis
      ↓
999 requests → cache
      │
      └── 1 request → PostgreSQL
Conceptually:
Request
   │
   ▼
Redis
   │
   ├── HIT ──► return cached stories
   │
   └── MISS
          │
          ▼
      PostgreSQL
          │
          ▼
       Redis
          │
          ▼
       Response
This is called cache-aside or lazy caching.


Why port 6379?
6379 is Redis's default port.