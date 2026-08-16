# CityTwin voting backend

## Environment

Copy `.env.example` to `.env.local` and provide:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The frontend uses the public Supabase anon key. Never expose a Supabase service-role key in Vite environment variables or client code.

## Supabase table

The app uses the existing `public.votes` table (`id`, `project_id`, `priority`, `created_at`). No schema changes are required.

## API contract

- `insertVote(projectId, priority)` inserts and returns one vote. Supported projects are `flyover`, `underpass`, and `smart-junction`; supported priorities are `traffic`, `greenSpace`, `pedestrian`, and `emergency`.
- `getVotes()` returns all votes ordered by `created_at` ascending.
- `subscribeToVotes(callback)` listens for inserted rows and returns a cleanup function. Multiple callers share one realtime channel until all cleanups run.
- `updateVoteCounts(votes)` returns counts grouped by known project and priority IDs.

## Realtime test

Open the app in two browser tabs. In one tab, call `insertVote('flyover', 'traffic')`; the other tab's `subscribeToVotes` callback should receive the inserted row without a refresh. Ensure the `votes` table is included in the Supabase Realtime publication.
