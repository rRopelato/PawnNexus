# PawnNexus Launch Guide

This guide explains how to take PawnNexus from a local project to a live production deployment on Cloudflare.

PawnNexus has three deployment pieces:

- Frontend: React/Vite app deployed to Cloudflare Pages
- API: Hono Cloudflare Worker deployed with Wrangler
- Data/storage: Cloudflare D1 and Cloudflare R2

## 1. Requirements

Install these before launching:

- Node.js 20 or newer
- npm
- Git
- A Cloudflare account
- Wrangler login access to the Cloudflare account
- A domain name, optional but recommended

Check local versions:

```sh
node --version
npm --version
```

Install dependencies from the repository root:

```sh
npm install
```

Login to Cloudflare:

```sh
npx wrangler login
```

## 2. Verify The App Locally

Run type checks:

```sh
npm run typecheck
```

Run a production build:

```sh
npm run build
```

Run the Worker locally:

```sh
npm run dev:worker
```

Run the frontend locally in another terminal:

```sh
npm run dev:frontend
```

Open:

```txt
http://localhost:5173
```

The frontend proxies `/api` requests to the local Worker at:

```txt
http://localhost:8787
```

## 3. Local Environment File

For local Worker auth, create `worker/.dev.vars`:

```txt
JWT_SECRET=replace-with-a-long-random-local-secret
```

Never commit this file. It is already ignored by `.gitignore`.

## 4. Create Cloudflare D1

From the `worker` directory:

```sh
cd worker
npx wrangler d1 create pawnnexus
```

Cloudflare will return a `database_id`. Copy it into `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "pawnnexus"
database_id = "paste-real-database-id-here"
migrations_dir = "migrations"
```

Apply all migrations to production:

```sh
npx wrangler d1 migrations apply pawnnexus --remote
```

The current migrations create:

- `users`
- `pawns`
- pawn details/activity fields
- pawn race
- usernames
- banned email list

## 5. Create Cloudflare R2

Create the bucket:

```sh
npx wrangler r2 bucket create pawnnexus-images
```

The bucket binding in `worker/wrangler.toml` should match:

```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "pawnnexus-images"
```

## 6. Configure Image URLs

For local development, the Worker serves uploaded images through:

```txt
/images/<key>
```

For production, use a real public URL for R2 images.

Recommended options:

- Set up a custom domain for the R2 bucket, such as `images.yourdomain.com`
- Or serve images through the Worker using `/images/*`

If using a public R2/custom image domain, update `worker/wrangler.toml`:

```toml
[vars]
PUBLIC_IMAGE_BASE_URL = "https://images.yourdomain.com"
```

If you leave the placeholder `https://images.example.com`, uploads will fall back to Worker-served image URLs in local/dev behavior. Before production, replace it with a real domain or intentionally keep Worker image serving.

## 7. Configure Worker Secrets

Set the production JWT secret:

```sh
cd worker
npx wrangler secret put JWT_SECRET
```

Use a long random value. For example, generate one locally with:

```sh
openssl rand -base64 48
```

Do not put production secrets in GitHub.

## 8. Deploy The Worker API

From the `worker` directory:

```sh
npm run deploy
```

Or directly:

```sh
npx wrangler deploy
```

After deploy, Wrangler will show the Worker URL, usually like:

```txt
https://pawnnexus-api.<your-subdomain>.workers.dev
```

Save that URL. The frontend needs it as `VITE_API_BASE_URL`.

## 9. Configure Frontend API URL

For local development, the frontend uses `/api` and Vite proxies to the Worker.

For production, Cloudflare Pages needs an environment variable:

```txt
VITE_API_BASE_URL=https://your-worker-url.workers.dev
```

If you later route the Worker under the same domain, for example `https://api.yourdomain.com`, use that instead.

## 10. Deploy The Frontend To Cloudflare Pages

Push the project to GitHub first.

In Cloudflare Dashboard:

1. Go to Workers & Pages
2. Create Application
3. Select Pages
4. Connect your GitHub repository
5. Choose the PawnNexus repository
6. Configure build settings:

```txt
Root directory: frontend
Build command: npm install && npm run build
Build output directory: dist
```

Add the production environment variable:

```txt
VITE_API_BASE_URL=https://your-worker-url.workers.dev
```

Deploy.

## 11. Connect A Domain

Recommended domain layout:

```txt
pawnnexus.com           -> Cloudflare Pages frontend
api.pawnnexus.com       -> Cloudflare Worker API
images.pawnnexus.com    -> R2 images, optional
```

In Cloudflare:

1. Add your domain to Cloudflare DNS
2. Point the root domain or app subdomain to Cloudflare Pages
3. Add a route or custom domain for the Worker API
4. Add a custom domain for R2 if you want public image delivery outside the Worker

If the Worker API moves to a custom domain, update the Pages environment variable:

```txt
VITE_API_BASE_URL=https://api.pawnnexus.com
```

Redeploy Pages after changing environment variables.

## 12. Make Your User Admin

First, register normally through the app.

Then promote your account in production D1:

```sh
cd worker
npx wrangler d1 execute pawnnexus --remote --command "UPDATE users SET role = 'admin' WHERE lower(email) = lower('your@email.com');"
```

For local development, use `--local`:

```sh
npx wrangler d1 execute pawnnexus --local --command "UPDATE users SET role = 'admin' WHERE lower(email) = lower('your@email.com');"
```

Log out and log back in after promotion so the UI sees the new role.

## 13. Admin Panel Checklist

After becoming admin, open:

```txt
/admin
```

Verify you can:

- See account totals
- See pending pawn totals
- See approved pawn totals
- Review pending pawns
- Approve pawns
- Reject pawns
- Delete pawns
- See accounts
- Delete troll accounts
- Ban email addresses
- Unban email addresses

Banned emails cannot register again, and existing accounts with that email are marked banned.

## 14. First Production Test

After deploy, test this flow:

1. Register an account
2. Promote yourself to admin
3. Log out and log back in
4. Add a pawn
5. Upload a JPG or PNG image
6. Confirm upload preview works
7. Confirm the pawn is pending
8. Open Admin Dashboard
9. Approve the pawn
10. Open Browse and confirm the pawn appears publicly
11. Open the pawn details page
12. Confirm owner shows username, not email
13. Confirm the image loads

## 15. Upload Rules

Images are restricted to:

- `.jpg`
- `.jpeg`
- `.png`

The frontend file picker restricts selection, and the Worker validates MIME type and file extension again.

Maximum upload size is currently:

```txt
5 MB
```

This is enforced in `worker/src/validation.ts`.

## 16. Pawn Activity Rules

New pawns start with:

```txt
3/3 activity stars
```

If the owner does not refresh the pawn weekly:

- After one missed week, it drops to 2 stars
- After two missed weeks, it drops to 1 star
- At 1 star, the pawn is hidden from public browsing
- It remains visible to the owner in profile/My Pawns

Owners and admins can refresh the pawn from the pawn details page.

## 17. Privacy Rules

Public users should see usernames, not email addresses.

Email addresses are only visible in:

- Login/register forms
- The admin account management view
- D1 database records

Public pawn cards and details use:

```txt
ownerUsername
```

## 18. GitHub Safety Checklist

Before pushing to GitHub, run:

```sh
git status --short
```

These should not appear in Git:

- `worker/.dev.vars`
- `.env`
- `.env.local`
- `.wrangler`
- `node_modules`
- `dist`
- `*.tsbuildinfo`

They are already listed in `.gitignore`.

Also scan for obvious secrets:

```sh
grep -R "JWT_SECRET\|PRIVATE KEY\|BEGIN RSA\|BEGIN OPENSSH" -n --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.wrangler .
```

Documentation examples are fine. Real secrets are not.

## 19. Deployment Commands Summary

From repository root:

```sh
npm install
npm run typecheck
npm run build
```

From `worker`:

```sh
npx wrangler login
npx wrangler d1 create pawnnexus
npx wrangler r2 bucket create pawnnexus-images
npx wrangler secret put JWT_SECRET
npx wrangler d1 migrations apply pawnnexus --remote
npx wrangler deploy
```

Then deploy `frontend` through Cloudflare Pages.

## 20. Updating Production Later

When code changes:

1. Run local checks:

```sh
npm run typecheck
npm run build
```

2. If new D1 migrations exist:

```sh
cd worker
npx wrangler d1 migrations apply pawnnexus --remote
```

3. Deploy Worker if API changed:

```sh
cd worker
npm run deploy
```

4. Push frontend changes to GitHub and let Cloudflare Pages redeploy.

## 21. Rollback Notes

For frontend issues:

- Use Cloudflare Pages deployment history
- Roll back to the previous successful deployment

For Worker issues:

- Redeploy a previous Git commit
- Keep migrations backward compatible whenever possible

For D1 issues:

- Export/backup before risky migrations
- Avoid destructive schema changes without backups

## 22. Pre-Launch Final Checklist

Before announcing the site:

- Production D1 database created
- All D1 migrations applied remotely
- R2 bucket created
- Image URL strategy works
- JWT secret set in Cloudflare
- Worker deployed
- Pages deployed
- `VITE_API_BASE_URL` set correctly
- Domain connected
- Admin account promoted
- Test pawn approved and visible
- Login/register tested
- Upload tested with JPG and PNG
- Admin ban/delete tools tested
- Footer/support links checked
- Pix/Ko-fi details configured if desired

## 23. Pix And Ko-fi Configuration

Support page settings live in:

```txt
frontend/src/lib/support.ts
```

Update:

```ts
export const creator = {
  name: 'rRopelato',
  githubUrl: 'https://github.com/rRopelato',
  koFiUrl: 'https://ko-fi.com/rropelato',
  pixQrCodeUrl: '',
};
```

For Pix, add a QR image to the frontend public assets later or use a stable hosted image URL, then set `pixQrCodeUrl`.

## 24. Cost Notes

The MVP is designed to stay near free-tier usage:

- Cloudflare Pages for frontend
- Cloudflare Workers for API
- Cloudflare D1 for database
- Cloudflare R2 for images

Costs may increase with image storage, image bandwidth, Worker traffic, or D1 usage as the community grows.
