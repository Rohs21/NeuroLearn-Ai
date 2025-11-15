<#
PowerShell helper to add `NEXTAUTH_URL` and `NEXTAUTH_SECRET` to a Vercel project.

Usage:
  - Run interactively: `.	ools\set-vercel-env.ps1`
  - Or pass parameters: `.	ools\set-vercel-env.ps1 -project my-vercel-project -nextauthUrl https://my-app.vercel.app`

Notes:
  - Requires the Vercel CLI to be installed and authenticated (`npm i -g vercel`).
  - The script will attempt to add env vars to the `production` environment.
  - If you prefer, set env vars via the Vercel dashboard instead.
#>

param(
  [string]$project = "",
  [string]$nextauthUrl = "",
  [string]$nextauthSecret = ""
)

function Ensure-VercelCLI {
  if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
  }
}

Ensure-VercelCLI

if ($nextauthUrl -eq "") {
  $nextauthUrl = Read-Host "Enter your Vercel deploy URL (e.g. https://your-app.vercel.app)"
}

if ($nextauthSecret -eq "") {
  Write-Host "Generating a 48-byte random secret (Base64)..."
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $nextauthSecret = [System.Convert]::ToBase64String($bytes)
  Write-Host "Generated secret. Keep it safe."
}

$projArg = @()
if ($project -ne "") { $projArg = @("--project", $project) }

Write-Host "Adding NEXTAUTH_URL to production environment..."
vercel env add NEXTAUTH_URL $nextauthUrl production @projArg

Write-Host "Adding NEXTAUTH_SECRET to production environment..."
vercel env add NEXTAUTH_SECRET $nextauthSecret production @projArg

Write-Host "Environment variables added. Redeploy your project (e.g. `vercel --prod` or via the dashboard)."
