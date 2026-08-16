# design from requirements

A user can: 
- create an account
- bookmark stories
- read stories
- have preferences
- receive personalized news
- interact with topics

A story can:
- come from a source
- have an author
- have a URL
- belong to topics
- belong to a cluster
- have AI-generated information
- have bias information
- be bookmarked by many users
- be read by many users

A source can:
- publish many stories
- have a name
- have a URL
- have metadata
- have a source type


# NEWSLENS DATABASE — INITIAL DESIGN

- User
- Source
- Story
- Bookmark
- ReadingHistory
- Topic
- StoryTopic
- StoryCluster
- AISummary
- BiasRating
- UserPreference

# relationships:

- User 1 → many Bookmark
- Story 1 → many Bookmark

- User 1 → many ReadingHistory
- Story 1 → many ReadingHistory

- Source 1 → many Story

- Story many ↔ many Topic
- through StoryTopic

- StoryCluster 1 → many Story

- User 1 → many UserPreference


# AI pipeline

┌─────────────────────────────────────────┐
│ OpenAI releases a new model             │
│ Reuters • 2 hours ago                   │
├─────────────────────────────────────────┤
│                                         │
│ AI SUMMARY                              │
│ ─────────────────────────────────────── │
│ 5 key points...                         │
│                                         │
│ RELATED COVERAGE                        │
│ BBC • TechCrunch • The Verge            │
│                                         │
├─────────────────────────────────────────┤
│ ARTICLE                                 │
│                                         │
│ [Full permitted article content]        │
│                                         │
├─────────────────────────────────────────┤
│ SOURCE & BIAS                           │
│ Reuters                                 │
│ ...                                     │
└─────────────────────────────────────────┘

# relationship diagram

                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
               ┌────────────────┼─────────────────┐
               │                │                 │
               ▼                ▼                 ▼
          Bookmark       ReadingHistory     UserPreference
               │                │                 │
               │                │                 ▼
               │                │                Topic
               │                │
               ▼                ▼                 ▲
          ┌─────────────────────────┐             │
          │          Story          │─────────────┘
          └───────────┬─────────────┘
                      │
           ┌──────────┼─────────────┐
           │          │             │
           ▼          ▼             ▼
        Source     Cluster       AISummary
                      │
                      ▼
                    Story

Story * ─────── * Topic
        StoryTopic


# Final database blueprint

┌──────────────────────────────────────────────┐
│                    USERS                     │
├──────────────────────────────────────────────┤
│ id                                           │
│ name                                         │
│ email                                        │
│ password_hash                                │
│ created_at                                   │
│ updated_at                                   │
└──────────────────────┬───────────────────────┘
                       │
        ┌──────────────┼───────────────┐
        │              │               │
        ▼              ▼               ▼
   BOOKMARKS     READING_HISTORY   USER_PREFERENCES
        │              │               │
        └──────┬───────┘               ▼
               │                     TOPICS
               ▼                       ▲
             STORIES ───── STORY_TOPICS┘
               │
        ┌──────┼─────────┐
        │      │         │
        ▼      ▼         ▼
     SOURCES CLUSTERS  AI_SUMMARIES


# Why PostgreSQL?

You already know the basics of PostgreSQL, so let's focus on why we're choosing it for NewsLens.
Our application now needs relationships such as:

