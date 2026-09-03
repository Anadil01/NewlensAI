// Shared cache keys so queries and mutations agree on what to invalidate.
//
// Keys are hierarchical: invalidating a prefix invalidates everything under it.
// `queryClient.invalidateQueries({ queryKey: queryKeys.stories.all })` clears
// every page/search combination, while `queryKeys.stories.list({ page: 2 })`
// targets one entry.
export const queryKeys = {
  bookmarks: ["bookmarks"],

  stories: {
    all: ["stories"],
    list: (params) => ["stories", params],
    detail: (id) => ["stories", "detail", id],
    search: (params) => ["stories", "search", params],
    related: (id) => ["stories", "related", id]
  },

  clusters: {
    all: ["clusters"],
    list: (params) => ["clusters", params],
    detail: (id) => ["clusters", "detail", id]
  },

  feed: {
    all: ["feed"],
    list: (params) => ["feed", params]
  },

  topics: ["topics"],

  sources: ["sources"],

  preferences: ["me", "preferences"],


  sourcePreferences: ["me", "source-preferences"],

  storyFeedback: (id) => ["stories", "feedback", id],

  storySkip: (id) => ["stories", "skip", id]
};
