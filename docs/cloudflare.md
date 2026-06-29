# Cloudflare Setup

## D1

Create a D1 database and apply the schema in `worker/migrations/0001_initial.sql`.

```sh
npx wrangler d1 create pawnnexus
npx wrangler d1 migrations apply pawnnexus --local
```

## R2

Create a bucket for pawn screenshots.

```sh
npx wrangler r2 bucket create pawnnexus-images
```

## Secrets

Set a strong JWT secret before deploying.

```sh
npx wrangler secret put JWT_SECRET
```

For local development, create `worker/.dev.vars`:

```txt
JWT_SECRET=replace-with-a-long-random-string
```
