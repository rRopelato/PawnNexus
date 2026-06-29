# PawnNexus

PawnNexus is a community website for sharing Dragon's Dogma 2 pawns. It is designed as a lightweight Cloudflare-first application with a React frontend and a Hono-powered Worker API.

## Stack

- Frontend: React, Vite, TypeScript, React Router, TailwindCSS
- Backend: Cloudflare Workers, Hono, TypeScript
- Database: Cloudflare D1
- Storage: Cloudflare R2
- Authentication: JWT with email and password

## Structure

- `frontend` - React application
- `worker` - Cloudflare Worker API
- `docs` - project notes and setup documentation

## Development

Install dependencies:

```sh
npm install
```

Run the frontend:

```sh
npm run dev:frontend
```

Run the Worker:

```sh
npm run dev:worker
```

Run type checks:

```sh
npm run typecheck
```

## Status

This repository is at the MVP scaffold stage. See [docs/mvp.md](docs/mvp.md) for the implementation checklist.
