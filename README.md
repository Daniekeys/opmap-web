# opmap-web

The Next.js frontend for Opportunity Map. Screens only: every read and write goes through `opmap-api`, which owns the specs and the data contracts. Read `CLAUDE.md` and `AGENTS.md` before changing code.

## Run it locally

Needs Node 24 and `opmap-api` running on port 3000 (see its README).

```sh
cp .env.example .env.local    # API_URL=http://localhost:3000
npm install
npm run dev                   # http://localhost:3001
```

The API's `BETTER_AUTH_URL` and `WEB_ORIGIN` must both be this app's origin (`http://localhost:3001`). Two setups are supported: fully local, and Vercel to Railway. Local web against the Railway API is not.

## How it talks to the API

- The browser only talks to this origin. `next.config.ts` forwards `/api/*` to `API_URL`, so the Better Auth cookie is same-origin and there is no CORS setup.
- Server components call the API directly at `API_URL` with the request's cookie (`src/lib/api.ts`).
- `src/lib/api-types/` holds typed copies of the API responses used here. Change the API first, then the copy.

## Sessions and Cache Components

Cache Components is on, so each route has a static shell and everything else streams in per request.

- Nothing that depends on the session or the workspace uses `use cache`. It is read at request time inside a `<Suspense>` boundary and never stored on the server.
- The active workspace is the slug in the URL (`/w/<slug>/...`), not a cookie. Switching workspace is a navigation.
- `src/proxy.ts` sends requests with no session cookie to `/login`. That check is only a shortcut: `getMe()` asks the API on every render and redirects on a 401.
- Signing in and out do a full page load, so the router's in-memory cache never carries from one user to the next.

## Routes

| Route | What |
| --- | --- |
| `/login` | Sign in through Better Auth. No sign-up: accounts come from invites |
| `/` | Goes to the user's first workspace |
| `/w/<slug>` | Workspace overview: members and recent pipeline runs |
| `/w/<slug>/test-job` | Owners only. Starts the API's test job and shows it in the progress panel. Members get no nav link and an "owners only" message if they open the URL |

## Deploy to Vercel

Hosted on Vercel Pro. `opmap-api` and Postgres stay on Railway (see its README).

1. Import the `Daniekeys/opmap-web` GitHub repo into Vercel, production branch `main`. Framework preset Next.js, default build and output settings.
2. Set this variable for Production (and Preview, if you use previews against the same API):

   | Variable | Value | Why |
   | --- | --- | --- |
   | `API_URL` | The Railway API's public URL (`https://...`, no trailing slash) | Vercel can't reach Railway's private network. `next build` writes it into the `/api/*` rewrite, so changing it needs a redeploy |

3. On the Railway `api` service, set both `BETTER_AUTH_URL` and `WEB_ORIGIN` to the Vercel production URL, then let it redeploy. The browser only sees the web origin, so that is the origin Better Auth must trust and issue cookies for.
4. Open the Vercel URL and sign in. As an owner, open Test job and run it.

Preview deployments get their own URLs, which are not in `WEB_ORIGIN`, so sign-in only works on the production URL.
