"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye, EyeOff, Mail, Lock, User, AlertCircle,
  ArrowRight, Loader2, CheckCircle2,
} from "lucide-react"
import Link from "next/link"

function StrengthBar({ password }: { password: string }) {
  const len = password.length
  const score = len === 0 ? 0 : len < 4 ? 1 : len < 7 ? 2 : 3
  const labels = ['', 'Weak', 'Fair', 'Strong']
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-green-500']

  if (len === 0) return null
  return (
    <div className="flex items-center gap-2 mt-1.5 animate-in fade-in duration-200">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-muted'}`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-medium transition-colors ${
        score === 1 ? 'text-red-500' : score === 2 ? 'text-amber-500' : 'text-green-500'
      }`}>
        {labels[score]}
      </span>
    </div>
  )
}

export default function SignUpForm() {
  const [name, setName]                   = useState("")
  const [email, setEmail]                 = useState("")
  const [password, setPassword]           = useState("")
  const [confirmPassword, setConfirm]     = useState("")
  const [showPass, setShowPass]           = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [error, setError]                 = useState("")
  const [success, setSuccess]             = useState(false)
  const [loading, setLoading]             = useState(false)

  const router = useRouter()

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push("/auth/signin?message=Account created successfully"), 1000)
      } else {
        setError(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
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
          <h3 className="text-xl font-bold">Account created!</h3>
          <p className="text-sm text-muted-foreground">Taking you to sign in…</p>
        </div>
        <div className="h-1 w-32 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-[progress_1s_ease-in-out_forwards]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="space-y-1 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
        <p className="text-sm text-muted-foreground">Get started with NeuroLearn for free</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-3 duration-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name */}
        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-75">
          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="pl-10 h-11 rounded-xl border-border/60 focus-visible:border-foreground/40 focus-visible:ring-foreground/10 transition-all"
            />
          </div>
        </div>

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
              className="pl-10 h-11 rounded-xl border-border/60 focus-visible:border-foreground/40 focus-visible:ring-foreground/10 transition-all"
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
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-10 pr-11 h-11 rounded-xl border-border/60 focus-visible:border-foreground/40 focus-visible:ring-foreground/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <StrengthBar password={password} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={e => setConfirm(e.target.value)}
              required
              className={`pl-10 pr-11 h-11 rounded-xl transition-all ${
                passwordsMatch
                  ? 'border-green-500/50 focus-visible:border-green-500/60 focus-visible:ring-green-500/20'
                  : passwordMismatch
                  ? 'border-destructive/50 focus-visible:border-destructive/60 focus-visible:ring-destructive/20'
                  : 'border-border/60 focus-visible:border-foreground/40 focus-visible:ring-foreground/10'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {passwordsMatch && (
              <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 animate-in zoom-in-50 duration-200" />
            )}
          </div>
          {passwordMismatch && (
            <p className="text-[11px] text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="h-3 w-3" /> Passwords don&apos;t match
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-1 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-250">
          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold gap-2 bg-foreground hover:bg-foreground/90 active:scale-[0.98] transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create Account
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
          <span className="text-xs text-muted-foreground whitespace-nowrap">Already have an account?</span>
          <div className="flex-1 border-t" />
        </div>

        <Link href="/auth/signin" className="block mt-3">
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl font-medium hover:bg-muted/60 active:scale-[0.98] transition-all"
          >
            Sign in instead
          </Button>
        </Link>
      </div>

    </div>
  )
}
