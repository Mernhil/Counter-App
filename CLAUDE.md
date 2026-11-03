## Working setup
- The project has a local folder (this one), which is where the work happens.
- The GitHub repo for the project is https://github.com/Mernhil/Counter-App (public), linked as the "origin" remote.
- Do not commit or push without the user's explicit confirmation.

## Stack
React + TypeScript + Vite PWA, Dexie (IndexedDB) storage, Recharts, date-fns, Vitest. Local-first, no backend.
- Data model: counters and taps are UUID-keyed with `updatedAt` and a soft-delete flag (`deleted`), so sync can be added later.
- Stats logic is pure functions in `src/stats.ts` (tests in `src/stats.test.ts`).
- Commands: `npm run dev`, `npm test`, `npm run build`.
