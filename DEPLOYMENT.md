Deployment notes — required environment variables
==============================================

Required environment variables for production (Vercel):

- `NEXTAUTH_URL` — the full URL of your deployed app (e.g. `https://your-app.vercel.app`).
- `NEXTAUTH_SECRET` — a long, random secret used by NextAuth to sign/encrypt cookies/JWTs.

Why these matter:
- NextAuth needs `NEXTAUTH_URL` to build callback URLs and cookies correctly in production.
- Without `NEXTAUTH_SECRET` the JWT/cookie verification may fail which causes redirect loops.

How to set them:

1) Vercel Dashboard (recommended):
   - Open your project on Vercel -> Settings -> Environment Variables.
   - Add `NEXTAUTH_URL` with value `https://your-app.vercel.app` and target `Production`.
   - Add `NEXTAUTH_SECRET` with a secure value (at least 32 bytes of random data). Example format: a long hex string or base64.
   - Redeploy the project.

2) Vercel CLI (example):
   - Install & login: `npm i -g vercel` then `vercel login`.
   - Run the included helper script (PowerShell):

```powershell
.
\scripts\set-vercel-env.ps1
```

   - The script will prompt for `NEXTAUTH_URL` and will generate a secure `NEXTAUTH_SECRET` if you don't provide one.

Checking logs after deploy:
- After deploying, check Vercel logs for messages prefixed with `[NextAuth]` or `[NextAuth][middleware]`.
- You can also call the temporary debug endpoint (remove it after verification):

  `GET https://your-app.vercel.app/api/debug/auth`

  The endpoint reports whether a NextAuth token was found and whether env vars are set.

Security note:
- Do not commit your `NEXTAUTH_SECRET` to source control. Use environment variables only.
- Remove the debug endpoint (`app/api/debug/auth`) after verifying production behavior.
