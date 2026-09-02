# NewsLensAI — Frontend

React 19 + Vite 8 + Tailwind 4. Design is settled — we improve it one step at a time,
verifying each step with `npm run lint` and `npm run build` before moving on.

## Progress log

### Step 1 — Align frontend with the backend API contract (done)

The backend wraps every success response as `{ success, message, data }`, but the pages
were reading the envelope as if it were the payload. The data model had also moved from
Mongo to Prisma/Postgres, so field names were stale.

- `src/api/axios.js` — response interceptor unwraps `data` once and keeps the server
  `message` on the response. Error responses keep their raw body, so
  `error.response.data.message` still works at the call sites.
  - This also fixed login storing the whole envelope in `localStorage`, which made
    `user.token` `undefined` and sent every protected request unauthenticated.
- `src/components/StoryCard.jsx` — `story._id` → `story.id`, `story.url` →
  `story.canonicalUrl`, `story.postedAt` → `story.publishedAt`. Added a safe URL host
  parser (no crash on a missing/invalid URL) and a relative time label ("3h ago").
- `src/pages/Home.jsx` — reads `data.stories` / `data.pagination`, keys cards by `story.id`.
- `src/pages/Bookmarks.jsx` — unwraps `data.bookmarks[].story` (the API returns bookmark
  rows with a nested story) instead of storing the envelope as the story list.

### Step 2 — TanStack Query for server state (done)

The dependency was installed but unused; fetching lived in `useEffect` + `useState`, and
bookmark state was patched by hand on each screen.

- `src/api/queryClient.js` — single `QueryClient`. `staleTime` is 60s to match the
  backend's Redis cache window on `/stories`, `refetchOnWindowFocus` off, one retry.
- `src/api/queryKeys.js` — shared keys so queries and mutations agree on what to invalidate.
- `src/hooks/useStories.js` — `/stories` keyed by `{ page, limit, search }`, so revisiting
  a page or search term is served from cache.
- `src/hooks/useBookmarks.js` — `/bookmarks`, `enabled` only when signed in, and it
  flattens the response to a plain story array.
- `src/hooks/useToggleBookmark.js` — mutation that invalidates the bookmarks key on
  success and owns the toast messages.
- `src/main.jsx` — `QueryClientProvider` mounted inside the existing providers.
- `StoryCard` now derives `isBookmarked` from the bookmarks cache instead of taking it as
  a prop, and disables the button while the mutation is pending. Because all cards share
  one cache entry, a grid of cards still makes a single `/bookmarks` request.
- `Home` and `Bookmarks` dropped their local fetching state — no more `console.log`
  swallowing of load failures on Bookmarks, no manual list filtering after a toggle.

### Step 3 — 401 handling and dead code (done)

- `src/api/axios.js` — an error interceptor calls a registered handler on any 401 from a
  protected route. Login and register are excluded, since a 401 there is a form error, not
  an expired session.
- `src/context/AuthContext.jsx` — registers that handler: it clears the stored user, drops
  the per-user bookmarks cache so the next session can't read the previous user's data,
  and shows "Your session expired." Logout goes through the same cleanup path.
- Deleted `src/layouts/MainLayout.jsx` — nothing imported it; `AuthLayout` is the only
  layout the router uses.

Verified after each step: `npm run lint` clean, `npm run build` succeeds.

## Remaining work

Rough order, one at a time:

- [ ] Use the dedicated `GET /api/stories/search` endpoint for the search box instead of
      the `search` query param on `/api/stories`.
- [ ] Visible error state when a query fails — the hooks expose `error`, but no screen
      renders it yet, so a failed fetch still looks like an empty feed.
- [ ] Surface the AI summary and bias data that ingestion already produces on the card.
- [ ] Story detail page backed by `GET /api/stories/:id`.
- [ ] Personalization surfaces: feed modes, topic and source preferences, feedback and
      skip actions (`/api/personalization/*`).
- [ ] Story clusters view (`/api/clusters`) to group coverage of the same event.
- [ ] Cursor pagination — the API returns `nextCursor`; the UI still only uses page numbers.
- [ ] Protect `/bookmarks` at the router level instead of branching inside the page.

---

## Notes: TanStack Query

What is TanStack Query?

- TanStack Query is a library for managing server state in frontend applications.
You can think of it as: A smart layer between your React application and your backend API.

TanStack Query can keep that result in its cache.

5. Refetching - It can refetch when appropriate.

Cache invalidation :- Suppose the user bookmarks a story.

We can tell TanStack Query: "The stories/bookmarks data may have changed. Refresh the relevant queries."

Deduplication - If multiple components request the same query, TanStack Query can avoid unnecessary duplicate requests.

“Our application consumes a lot of server-side data. Instead of manually managing API data, loading states, errors, caching, refetching, and synchronization with useEffect and useState, I use TanStack Query. It treats API responses as server state and gives us caching, query invalidation, refetching, and mutations out of the box. This keeps components much simpler.”

Interview question: "Why not use Context for API data?"
Answer:
“Context is primarily useful for sharing client-side state across the component tree. Server state has a different lifecycle because it comes from an external source and can become stale. TanStack Query is specifically designed to handle that lifecycle, including caching, refetching and invalidation. Therefore I keep authentication, theme and toast state in Context, while stories, bookmarks and recommendations are managed by TanStack Query.”
