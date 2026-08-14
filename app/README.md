# MotivReel — Motivational Video Blog

A full-screen, swipeable motivational reel collection built with **Next.js 16**, **Prisma 7**, and **PostgreSQL**.

## Quick Start

### 1. Set your database URL

Open `.env` and `.env.local` and replace the `DATABASE_URL` with your Prisma Postgres connection string from [console.prisma.io](https://console.prisma.io):

```
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY_HERE"
```

### 2. Run database migration

```bash
npx prisma migrate dev --name init
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the blog.

---

## Admin Panel

Go to [http://localhost:3000/admin](http://localhost:3000/admin) and enter your PIN (`0000` by default, change in `.env.local`).

### Supported platforms
- **YouTube Shorts** — `youtube.com/shorts/ID` or `youtu.be/ID`
- **Instagram Reels** — `instagram.com/reel/ID/`
- **ShareChat** — `sharechat.com/...` (opens in app, no embed)

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Prisma Postgres connection string | — |
| `ADMIN_PIN` | Admin panel PIN | `0000` |
| `JWT_SECRET` | JWT signing secret | dev default |

---

## Project Structure

```
src/
  app/
    page.tsx              # Main viewer (swipe through reels)
    page.module.css       # Viewer styles
    admin/
      page.tsx            # Admin dashboard
      admin.module.css    # Admin styles
    api/
      auth/route.ts       # PIN login API
      reels/route.ts      # List + add reels
      reels/[id]/route.ts # Delete + update reel
  lib/
    prisma.ts             # Prisma client singleton
    auth.ts               # JWT auth helpers
    platforms.ts          # URL parsing + embed generation
prisma/
  schema.prisma           # Database schema
prisma.config.ts          # Prisma 7 configuration
```
