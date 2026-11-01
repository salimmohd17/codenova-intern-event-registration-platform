# Supabase PostgreSQL setup

## Create the database

1. Create a Supabase project.
2. Open **Project Settings â†’ Database**.
3. Copy the transaction pooler connection string for Node.js.
4. Replace `[YOUR-PASSWORD]` with the database password.

Use the pooler host (`pooler.supabase.com`) for Render. It is preferred for serverless and pooled backend connections.

## Local configuration

Create `backend/.env` from `backend/.env.example`, then set:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
PORT=5003
NODE_ENV=development
```

Do not use a Vite `VITE_` variable or commit `.env`.

## Migrations

From the backend directory:

```sh
npm install
npm run migrate
```

Migrations are also applied automatically when the backend starts. Re-running migrations does not recreate existing tables or destroy data.

## Render configuration

In the Render service environment settings add:

- `DATABASE_URL`: the Supabase transaction pooler connection string
- `ADMIN_KEY`: a private value
- `FRONTEND_ORIGIN`: the exact Vercel frontend origin
- `NODE_ENV=production`

Keep Render's start command as:

```sh
npm start
```

## Verify

Run:

```sh
npm run db:check
npm start
```

`db:check` verifies the Supabase connection and prints the public database tables.
