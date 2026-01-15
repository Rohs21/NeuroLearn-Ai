# Dashboard Not Working on Vercel - Debugging Guide

## Problem
The dashboard works perfectly on `localhost` but doesn't work on the deployed Vercel link.

## Root Cause
The most common cause is **missing or incorrectly configured environment variables** on Vercel:
- `NEXTAUTH_URL` - Required for NextAuth to work in production
- `NEXTAUTH_SECRET` - Required for JWT/cookie verification

## Solution

### Step 1: Set Environment Variables on Vercel

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to your Vercel project: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your NeuroLearn-Ai project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` (replace with your actual Vercel URL) | Production |
   | `NEXTAUTH_SECRET` | (generate a secure 32+ byte random string - see below) | Production |

   **To generate NEXTAUTH_SECRET:**
   - Use this PowerShell command:
     ```powershell
     $bytes = New-Object byte[] 48
     [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
     [System.Convert]::ToBase64String($bytes)
     ```
   - Or paste a random 32+ character string (e.g., from a random string generator)

5. Click **Save**
6. **Redeploy** your project (either via `git push` or the Vercel redeploy button)

**Option B: Using Vercel CLI**

1. Install Vercel CLI if not already installed:
   ```powershell
   npm i -g vercel
   ```

2. Login to Vercel:
   ```powershell
   vercel login
   ```

3. Run the helper script:
   ```powershell
   .\scripts\set-vercel-env.ps1
   ```

4. Follow the prompts to enter your Vercel URL and let it generate a secure secret

### Step 2: Verify Environment Variables Are Set

Check that environment variables are correctly set by visiting the debug endpoint after redeployment:

```
https://your-app.vercel.app/api/debug/auth
```

**Expected Response:**
```json
{
  "tokenPresent": false,
  "env": {
    "NEXTAUTH_URL": true,
    "NEXTAUTH_SECRET_SET": true
  }
}
```

If `NEXTAUTH_URL` or `NEXTAUTH_SECRET_SET` show `false`, the variables are not properly set.

### Step 3: Check Vercel Logs

1. Go to your Vercel project dashboard
2. Click **Deployments**
3. Click the latest deployment
4. Go to **Functions** or **Logs** tab
5. Look for messages starting with `[NextAuth]` or `[NextAuth][middleware]`
6. Common issues:
   - `NEXTAUTH_URL=MISSING` - Environment variable not set
   - `NEXTAUTH_SECRET_SET=false` - Secret not configured
   - `Token not found` - Session not being created properly

### Step 4: Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `403 Forbidden` on `/dashboard` | Missing auth token | Check if login works; verify NEXTAUTH_URL |
| Redirect loop on login | `NEXTAUTH_SECRET` mismatch | Regenerate and set a new secret |
| Dashboard loads but no data | API calls failing | Check network tab in browser DevTools for 401/500 errors |
| "Unauthorized" errors | Session not persisting | Ensure cookies are being set (check browser DevTools) |

### Step 5: After Fixing Environment Variables

1. **Redeploy your project:**
   - Via Git: `git push` to your repository
   - Via Vercel Dashboard: Click the redeploy button on the latest deployment

2. **Clear browser cache and cookies:**
   - Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
   - Or clear site data in DevTools

3. **Test the dashboard:**
   - Go to `https://your-app.vercel.app/dashboard`
   - Try signing in again
   - Check if playlists and history load

### Step 6: Remove Debug Endpoint (Security)

After confirming everything works, remove the debug endpoint:

```bash
rm app/api/debug/auth/route.ts
```

Then commit and push the change.

## Still Not Working?

1. **Check Network Requests:**
   - Open DevTools (F12)
   - Go to **Network** tab
   - Check `/api/user/playlists` and `/api/history` responses
   - Look for 401 (Unauthorized) or 500 (Server Error) responses

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to **Console** tab
   - Look for error messages

3. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Deployments → Latest → Functions
   - Search for error messages related to Prisma, database, or auth

4. **Verify Database Connection:**
   - Check that `DATABASE_URL` is also set on Vercel (if needed)
   - Ensure your database is accessible from Vercel servers

## Quick Checklist

- [ ] `NEXTAUTH_URL` is set to your Vercel URL (e.g., `https://your-app.vercel.app`)
- [ ] `NEXTAUTH_SECRET` is set to a secure random string
- [ ] Both variables are set for the **Production** environment
- [ ] Project has been **redeployed** after setting variables
- [ ] Browser cache has been cleared (`Ctrl+Shift+R`)
- [ ] `/api/debug/auth` returns `true` for both env variables
- [ ] Cookies are being set in the browser (check DevTools → Application → Cookies)

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Deployment Configuration](./DEPLOYMENT.md)
