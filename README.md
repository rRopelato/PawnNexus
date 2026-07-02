# PawnNexus

PawnNexus is a community-driven website for sharing and discovering Dragon's Dogma 2 pawns.

The project was created to fill the gap left by the original PawnGuild, which never expanded to Dragon's Dogma 2. The goal isn't to replace it, but to provide a modern alternative focused on the current game while keeping the experience simple and familiar.

The website allows players to register their pawns, browse other players' companions, search using different filters, and keep their pawn information up to date.

## Features

- User accounts with JWT authentication
- Email verification and password recovery
- Create, edit and manage pawn listings
- Multiple images per pawn
- Automatic image optimization (WebP/JPEG)
- Community moderation system
- Admin dashboard
- Activity tracking
- Responsive interface
- Cloudflare-based infrastructure

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Cloudflare Workers
- Hono
- D1 Database
- R2 Storage
- Resend
- JWT Authentication

## Infrastructure

PawnNexus runs entirely on Cloudflare services.

- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2

This keeps operational costs extremely low while providing a globally distributed infrastructure.

## Development

The repository contains separate production and development environments.

Development environment:

- Dedicated Worker
- Dedicated D1 database
- Separate Cloudflare Pages deployment

Changes are tested in the development environment before being deployed to production.

## Running locally

```bash
git clone https://github.com/rRopelato/PawnNexus.git

cd PawnNexus

npm install

npm run dev
```

The frontend and Worker can also be started independently:

```bash
npm run dev:frontend
npm run dev:worker
```

## Environment

The project requires Cloudflare resources and a few environment variables.

Examples include:

```
JWT_SECRET
RESEND_API_KEY
EMAIL_FROM
APP_BASE_URL
PUBLIC_IMAGE_BASE_URL
```

Production secrets are intentionally not included in this repository.

## Contributing

Suggestions, bug reports and pull requests are always welcome.

If you find an issue or have an idea for improving the project, feel free to open an Issue or submit a Pull Request.

## License

This project is licensed under the MIT License.

## Disclaimer

PawnNexus is a fan-made project created by the community.

Dragon's Dogma and Dragon's Dogma 2 are trademarks of Capcom. This project is not affiliated with or endorsed by Capcom.
