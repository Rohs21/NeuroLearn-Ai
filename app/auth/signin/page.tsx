"use client";

import SignInForm from "@/components/auth/signin-form"
import { Navbar } from "@/components/navbar"
import Hyperspeed from "@/components/Hyperspeed"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col relative z-10 bg-transparent">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Hyperspeed
          effectOptions={{
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.5,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0xFFFFFF,
              brokenLines: 0xFFFFFF,
              leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
              rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
              sticks: 0x03B3C3,
            }
          }}
        />
      </div>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <Navbar />

      {/* ── CENTERED FORM ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center px-4 py-12 relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px] opacity-70" />

        <div className="w-full max-w-[420px] my-auto bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-8 flex justify-center">
            <img src="/logo_normal.svg" alt="NeuroLearn Logo" className="h-10 w-auto dark:hidden" />
            <img src="/logo_normal_dark.svg" alt="NeuroLearn Logo" className="hidden dark:block h-10 w-auto" />
          </div>
          <SignInForm />
        </div>
        
        <p className="text-xs text-zinc-500 mt-8 relative z-10 animate-in fade-in duration-700 delay-300">
          &copy; {new Date().getFullYear()} NeuroLearn. All rights reserved.
        </p>

      </div>
    </div>
  )
}
