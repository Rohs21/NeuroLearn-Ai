"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye, EyeOff, Mail, Lock, AlertCircle,
  ArrowRight, Loader2, CheckCircle2,
} from "lucide-react"
import Link from "next/link"

export default function SignInForm() {
  const [email, setEmail]           = useState("")
  const [password, setPassword]     = useState("")
  const [showPass, setShowPass]     = useState(false)
  const [error, setError]           = useState("")
  const [success, setSuccess]       = useState(false)
  const [loading, setLoading]       = useState(false)

  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = (searchParams?.get("callbackUrl") as string) || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password. Please try again.")
      } else {
        setSuccess(true)
        // Brief success flash then navigate
        setTimeout(() => router.push(callbackUrl), 800)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 animate-in fade-in zoom-in-95 duration-300">
        <div className="h-16 w-16 rounded-full bg-green-500/15 flex items-center justify-center animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold">Welcome back!</h3>
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
        </div>
        <div className="h-1 w-32 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-[progress_0.8s_ease-in-out_forwards]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="space-y-1 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in to continue your learning journey</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-3 duration-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email */}
        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="pl-10 h-11 rounded-xl transition-all border-border/60 focus-visible:border-foreground/40 focus-visible:ring-foreground/10"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="pl-10 pr-11 h-11 rounded-xl transition-all border-border/60 focus-visible:border-foreground/40 focus-visible:ring-foreground/10"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-1 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold gap-2 bg-foreground hover:bg-foreground/90 active:scale-[0.98] transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Divider + secondary CTA */}
      <div className="animate-in fade-in duration-500 delay-300">
        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Don&apos;t have an account?</span>
          <div className="flex-1 border-t" />
        </div>

        <Link href="/auth/signup" className="block mt-3">
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl font-medium hover:bg-muted/60 active:scale-[0.98] transition-all"
          >
            Create an account
          </Button>
        </Link>
      </div>

    </div>
  )
}
