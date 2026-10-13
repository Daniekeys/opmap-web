# opmap-web

The Next.js frontend for Opportunity Map. Screens only: every read and write goes through `opmap-api`, which owns the specs and the data contracts. Read `CLAUDE.md` and `AGENTS.md` before changing code.

## Run it locally

Needs Node 24 and `opmap-api` running on port 3000 (see its README).

```sh
cp .env.example .env.local    # API_URL=http://localhost:3000
npm install
npm run dev                   # http://localhost:3001
```

The API's `WEB_ORIGIN` must be this app's origin (`http://localhost:3001`), and the test job page needs `ENABLE_DEV_ROUTES=true` on the API.

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
| `/w/<slug>/dev/test-job` | Starts the API's test job and shows it in the progress panel. On in `next dev`; a 404 in a production build unless `ENABLE_DEV_PAGES=true` |

## Deploy to Railway

Deployed as a second service in the same Railway project as `api` and Postgres.

1. In the project, add a service from the `Daniekeys/opmap-web` GitHub repo, branch `main`. Name it `web`.
2. On the `api` service, add the variable `PORT=3000` so its port is fixed.
3. On the `web` service, set these variables before the first build:

   | Variable | Value | Why |
   | --- | --- | --- |
   | `API_URL` | `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:3000` | Reaches the API over Railway's private network. `next build` writes it into the `/api/*` rewrite, so changing it needs a rebuild, which Railway does on any variable change |
   | `ENABLE_DEV_PAGES` | Leave unset | Set to `true` only while checking the test job on the live URL |

   If the API service has a different name, use that name in place of `api`.
4. `web` service settings: Builder Railpack (the default; it runs `npm run build` and `npm run start`, and `next start` listens on Railway's `PORT`). Healthcheck path `/login`. Serverless (app sleeping) on. Restart policy on failure.
5. Under Networking, generate a public domain for `web`.
6. On the `api` service, set both `BETTER_AUTH_URL` and `WEB_ORIGIN` to that public URL (`https://...`, no trailing slash), then let it redeploy. The browser only sees the web origin, so that is the origin Better Auth must trust and issue cookies for.
7. Open the web URL and sign in. To watch a test job there, set `ENABLE_DEV_ROUTES=true` on `api` and `ENABLE_DEV_PAGES=true` on `web`, run it as an owner, then unset both.

App sleeping stays off on `api`: the worker has to stay up to pick up jobs. The first request to a sleeping `web` takes a few seconds while it wakes.
