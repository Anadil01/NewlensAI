                    ┌──────────────┐
                    │   NewsAPI    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Python    │
                    │  Ingestion   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Normalizer   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ PostgreSQL   │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       Elasticsearch                  Redis
              │                         │
              └────────────┬────────────┘
                           ▼
                     Node.js API



                    NewsLens
                       │
          ┌────────────┴────────────┐
          │                         │
      Node.js API              Python Pipeline
          │                         │
          │                 ┌───────┴────────┐
          │                 │                │
          │            BeautifulSoup      NewsAPI
          │                 │                │
          │                 └───────┬────────┘
          │                         ↓
          │                  Normalization
          │                         ↓
          │                   NLP Pipeline
          │                         ↓
          │              ┌──────────┼──────────┐
          │              ↓          ↓          ↓
          │           Topics     Summary     Bias
          │              │          │          │
          └──────────────┴──────────┴──────────┘
                         ↓
                    PostgreSQL
                         ↓
                    Elasticsearch
                         ↓
                      Redis
                         ↓
                    React Frontend


# Why did you create a separate NewsAPI client?

"I separated external API communication from the ingestion business logic. The NewsAPI client is responsible only for communicating with NewsAPI, handling request configuration and API errors. This keeps the ingestion pipeline loosely coupled and makes it easier to add other sources later."

# Why not call NewsAPI directly from the Node.js API?

"News ingestion is an asynchronous background workload, not a user-facing request. Keeping ingestion separate prevents slow external APIs or scraping failures from affecting the application's request-response path."

### Python News Ingestion Service

NewsLens uses a separate Python ingestion service for external content acquisition.

Responsibilities:
- Fetch articles from NewsAPI
- Scrape additional sources using BeautifulSoup
- Normalize different article formats
- Prepare data for NLP processing

The service is isolated from the Node.js API because ingestion and NLP workloads are asynchronous background tasks.


"Why normalize articles?"

"Because NewsLens aggregates data from multiple sources. Each source exposes different fields and naming conventions. The normalization layer converts every incoming article into a common schema before storing it, which keeps the database consistent and makes downstream NLP processing source-independent."

## Python Ingestion Pipeline

NewsLens uses a dedicated Python ingestion service for collecting and processing news data.

### Supported Sources

1. NewsAPI
- Uses REST API integration
- Fetches structured articles
- Handles API authentication through environment variables

2. Hacker News
- Uses BeautifulSoup based HTML scraping
- Extracts title, URL, author and engagement points


### Source Adapter Architecture

Each source has an independent adapter.

Example:

NewsAPI:
    API Client
        |
        ↓
    Normalizer


Hacker News:
    BeautifulSoup Scraper
        |
        ↓
    Normalizer


All sources produce a common NewsLens Article schema before entering the storage pipeline.


Benefits:
- Adding new sources does not affect existing sources
- NLP pipeline receives consistent data
- Duplicate detection becomes easier
- Database schema remains clean


How would you add a new news source to NewsLens?"

"I designed the ingestion pipeline using source adapters and a central registry. Each source implements its own ingestion logic, whether that's an API client, HTML scraper, or RSS parser. The adapter normalizes the raw response into a common article schema. The registry manages enabled sources, so adding a new source doesn't require modifying the core ingestion pipeline."

"I used BeautifulSoup to scrape websites."


What happens if one scraper fails?"

"The orchestrator isolates source failures. Each source execution is wrapped independently, so a timeout or parsing error from one source doesn't stop the entire ingestion pipeline. We record the failure and continue processing the remaining sources. Later, failed sources can be retried through the background job system."


"I designed the ingestion layer around a source registry and orchestrator pattern. Each news source exposes a common scraper interface, so I can add new sources without modifying the orchestration logic. The orchestrator executes each source independently and isolates failures, meaning if one source goes down, the remaining sources continue processing."





AI Summarization 🤖

                    ┌── Hacker News
                    ├── NewsAPI
                    └── Other sources
                           ↓
                       Validator
                           ↓
                       PostgreSQL
                           ↓
                  Content Extraction
                           ↓
                  NLP Preprocessing
                           ↓
                    AI Summarizer   ← NEXT
                           ↓
                    Short Summary
                           ↓
                 Topic Classification
                           ↓
                  Story Clustering
                           ↓
                    Bias Detection