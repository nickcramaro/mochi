# Mochi

A virtual pet that evolves from your coding sessions. Think Tamagotchi meets developer tools — your creature grows, changes traits, and progresses through life stages based on how you work.

## How It Works

Each user gets a unique Mochi creature that starts as an egg. As you feed it session data (duration, tools used, sentiment, errors, time of day), it evolves:

- **Life stages:** egg → hatchling → juvenile → adult → elder (at 0, 3, 20, 100, 500 sessions)
- **Dormancy:** awake → drowsy → sleeping → deep sleep (based on time since last session)
- **Traits** (0–100): warmth, energy, complexity, stability, size, curiosity, intensity — each driven by different session metrics
- **Appearance:** procedurally generated pixel-art sprites change with traits, stage, and dormancy

## Project Structure

```
packages/
  api/        Hono + SQLite backend (auth, evolution engine, session tracking)
  web/        React + Vite + Tailwind frontend (creature renderer, dashboard)
  collector/  (planned) session data collector
```

## Setup

Requires [Bun](https://bun.sh).

```bash
bun install
```

### Run the API

```bash
cd packages/api
bun run migrate   # initialize the database
bun run dev       # starts on :3001
```

Environment variables (all optional):
- `PORT` — API port (default: 3001)
- `DB_PATH` — SQLite database path (default: ./mochi.db)
- `JWT_SECRET` — signing secret (default: dev secret)

### Run the frontend

```bash
cd packages/web
bun run dev       # starts on :5173, proxies /api to :3001
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account (email + password) |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/mochi` | Get your creature |
| POST | `/api/mochi/feed` | Submit a session |
| PATCH | `/api/mochi/name` | Rename your creature |
| GET | `/api/mochi/history` | Session history |
| GET | `/api/health` | Health check |

## Tech Stack

- **Runtime:** Bun
- **API:** Hono, SQLite, bcrypt, jose (JWT)
- **Frontend:** React 19, Vite, Tailwind CSS
- **Sprites:** Hand-drawn 16x16 templates with procedural recoloring and animation
