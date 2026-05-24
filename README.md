# Crack Protocol

Crack Protocol is infrastructure for sovereign agents: a static terminal-native frontend with Vercel serverless API routes for the NEO arena.

## Local Dev

```bash
npm install
npm run dev
```

`npm run dev` runs a local static/API server on port `8000`, importing the same `/api/*` handlers used by Vercel.

To run through the Vercel CLI directly:

```bash
npm run vercel
```

## Deployment Env Vars

Set these in Vercel:

```bash
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ADMIN_SECRET=
NEO_BREACH_SECRET=
```

The API routes use Upstash Redis for users, sessions, attempts, statistics, and leaderboard persistence. If Redis env vars are absent during local development, the API uses an in-memory fallback so the interface can still be exercised.

## Public Testing Notes

Identity is username, password, and pasted wallet address. Wallet address format is validated across common chains, but ownership proof requires a future signed wallet flow.

Eligible outcomes are reviewed manually. Rewards are distributed manually in USDC by the Crack Protocol team. Leaderboard placement does not guarantee payout. Duplicate, abusive, or low-quality attempts may be rejected.
