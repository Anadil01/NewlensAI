// Shared cache keys so queries and mutations agree on what to invalidate.
export const queryKeys = {
  bookmarks: ["bookmarks"],
  stories: (params) => ["stories", params]
};
