                    ┌───────────────┐
                    │    React      │
                    │   Frontend    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ API Gateway / │
                    │ Express API   │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      PostgreSQL          Redis          Search Engine
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                     Background Queue
                            │
               ┌────────────┼────────────┐
               ▼            ▼            ▼
           Ingestion       AI        Analytics
             Worker       Worker       Worker
               │            │
               ▼            ▼
          News Sources   OpenAI