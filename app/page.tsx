'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchBar } from '@/components/search-bar';
import { PlaylistGrid } from '@/components/playlist-grid';
import { Navbar } from '@/components/navbar';
import { AnimateSection } from '@/components/animate-section';
import { Button } from '@/components/ui/button';
import {
  GraduationCap, Sparkles, Brain,
  CheckCircle, ArrowUpRight, Plus, Minus, BookOpen,
  Zap, Target,
} from 'lucide-react';
import Link from 'next/link';
import Hyperspeed from '@/components/Hyperspeed';

// ─── Data ──────────────────────────────────────────────────────────────────────

const TOPICS = ['Python', 'JavaScript', 'React', 'Machine Learning', 'System Design', 'Data Science', 'TypeScript', 'Node.js'];

const WHY_TABS = [
  {
    id: 'curation', label: 'AI Curation',
    heading: 'Your Personal Learning Algorithm',
    body: 'Our AI scans thousands of YouTube videos, filters out low-quality content, and builds a structured playlist ranked by clarity, depth, and relevance — tailored to your topic in seconds.',
    features: ['Filters noise from 800M+ YouTube videos', 'Ranks by educational quality signals', 'Ordered from beginner to advanced automatically', 'Regenerates fresh results every search'],
  },
  {
    id: 'tracking', label: 'Progress Tracking',
    heading: 'Know Exactly Where You Stand',
    body: 'A LeetCode-style activity heatmap, daily streak counter, and per-video completion tracking. Your dashboard shows exactly what you have done and what is next.',
    features: ['GitHub-style activity heatmap (53 weeks)', 'Current streak and longest streak counters', 'Per-video completion with watch time', 'Analytics bar chart for weekly activity'],
  },
  {
    id: 'interviews', label: 'Mock Interviews',
    heading: 'Practice Before the Real Thing',
    body: 'AI-powered mock interviews tailored to your target job role and experience level. Answer questions, get scored, and receive detailed feedback to improve with every attempt.',
    features: ['Role and experience level customized', 'Real-time AI scoring and feedback', 'Track improvement across multiple attempts', 'Covers DSA, system design, and behavioral'],
  },
  {
    id: 'summaries', label: 'AI Summaries',
    heading: 'Retain What You Watch',
    body: 'Every video comes with an AI-generated summary and quiz. Skim the key points before watching, then test your understanding after — so learning sticks.',
    features: ['AI summary for every video in your playlist', 'Auto-generated quiz questions per video', 'Key takeaways extracted and structured', 'Save notes directly from the video player'],
  },
];

const LEARNING_PATHS = [
  { title: 'Python & Data Science',   desc: 'From syntax to pandas, numpy, and beyond',     icon: Brain },
  { title: 'Web Development',         desc: 'HTML to full-stack React and Node.js apps',     icon: Zap },
  { title: 'AI & Machine Learning',   desc: 'Neural networks, LLMs, and model fine-tuning', icon: Sparkles },
  { title: 'System Design',           desc: 'Scale systems the way big tech companies do',   icon: Target },
];

const STATS = [
  { num: '1,000+', label: 'Playlists Created',   body: 'Learners have built structured playlists across hundreds of topics — all curated by AI in seconds, not hours of manual searching.' },
  { num: '50k+',   label: 'Videos Curated',       body: 'Our AI has ranked and organized tens of thousands of YouTube videos into clean, beginner-to-advanced learning paths.' },
  { num: '95%',    label: 'Report Improvement',   body: 'Learners who complete their playlists and use mock interviews consistently report better confidence and interview performance.' },
];

const UNIQUE_FEATURES = [
  { title: 'Streak Tracking',       desc: 'Daily learning streaks keep you consistent and motivated.' },
  { title: 'AI-Curated Playlists',  desc: 'Best YouTube content found and ranked for you instantly.' },
  { title: 'Progress Dashboard',    desc: 'Heatmap, stats, and history all in one clean place.' },
  { title: 'Mock Interviews',       desc: 'AI-scored practice sessions for your target role.' },
  { title: 'Video Summaries',       desc: 'AI-generated key points for every video in your path.' },
  { title: 'Auto Quizzes',          desc: 'Test your knowledge right after watching.' },
];

const TESTIMONIALS = [
  { quote: 'NeuroLearn found the exact React tutorials I needed in minutes. Saved me hours of aimless YouTube scrolling. I went from confused to shipping features in 6 weeks.', name: 'Priya Sharma', role: 'Frontend Developer' },
  { quote: 'The mock interview feature prepared me better than any paid course I tried. I walked into my Google interview feeling ready. Got the offer.', name: 'Arjun Mehta', role: 'Software Engineer' },
  { quote: 'The streak system is addictive in the best way. I have learned every single day for 3 months. Landed my first internship last week.', name: 'Sofia Rodrigues', role: 'CS Student' },
  { quote: 'I built my entire machine learning foundation using NeuroLearn playlists. The beginner-to-advanced ordering is exactly what self-learners need.', name: 'Kavya Patel', role: 'Data Scientist' },
  { quote: 'The AI summaries before each video are a game changer. I can decide in 30 seconds if a video is worth my time. Zero wasted hours now.', name: 'Marcus Johnson', role: 'Backend Developer' },
  { quote: 'System design was intimidating until NeuroLearn built me a structured path. Three months later I can confidently design distributed systems.', name: 'Emma Chen', role: 'ML Engineer' },
  { quote: 'Used NeuroLearn to prep for my full-stack role interviews. The mock interviews caught exactly the gaps I had. Highly recommend to anyone job hunting.', name: 'Rohan Gupta', role: 'Full Stack Developer' },
];

const FAQS = [
  { q: 'Is NeuroLearn completely free?', a: 'Yes. NeuroLearn is free to use. Create an account and start building AI-curated playlists immediately — no credit card, no trial period.' },
  { q: 'How does the AI build my playlist?', a: 'You enter a topic, language, and difficulty. Our AI queries YouTube, scores videos by educational quality signals — channel authority, view patterns, structure — then ranks and sequences them from beginner to advanced.' },
  { q: 'What topics can I learn?', a: 'Anything covered on YouTube — programming languages, data science, AI, web development, system design, interview prep, math, and more. If good educational videos exist on the topic, NeuroLearn will find them.' },
  { q: 'How do mock interviews work?', a: 'Enter your target job role and years of experience. The AI generates relevant technical questions, you record your answers, and the AI scores each response with detailed written feedback and a final rating.' },
  { q: 'Can I track my learning progress?', a: 'Yes. Your dashboard includes a full activity heatmap (last 53 weeks), current and longest streak, completion rate, total watch time, and complete watch history.' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">{children}</p>;
}
function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white leading-tight">{children}</h2>;
}
function SectionSub({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base mt-3 max-w-xl mx-auto leading-relaxed">{children}</p>;
}

// ─── Testimonials (RAF scroll — no CSS width:max-content overflow) ────────────

type Testimonial = { quote: string; name: string; role: string };

function TestimonialsSection({ testimonials, hoveredTestimonial, setHoveredTestimonial }: {
  testimonials: Testimonial[];
  hoveredTestimonial: number | null;
  setHoveredTestimonial: (i: number | null) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);
  // duplicate for seamless loop
  const items = [...testimonials, ...testimonials];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const step = () => {
      if (!pausedRef.current) {
        el.scrollLeft += 0.7;
        // when first copy fully scrolled past, jump back silently
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <section className="py-24 border-t border-zinc-200 dark:border-white/10">
      <AnimateSection className="text-center mb-14 px-6">
        <SectionLabel>Learner Stories</SectionLabel>
        <SectionHeading>See what our learners<br />are saying.</SectionHeading>
        <SectionSub>Real people, real results. No paid reviews.</SectionSub>
      </AnimateSection>

      {/* scroll container — constrained to max-w-5xl, fade overlays on edges */}
      <div className="max-w-5xl mx-auto px-6 overflow-hidden relative">
        {/* left fade */}
        <div className="pointer-events-none absolute left-6 top-0 h-full w-20 z-10 bg-gradient-to-r from-zinc-50 dark:from-[#09090b] to-transparent" />
        {/* right fade */}
        <div className="pointer-events-none absolute right-6 top-0 h-full w-20 z-10 bg-gradient-to-l from-zinc-50 dark:from-[#09090b] to-transparent" />
      <div
        ref={trackRef}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; setHoveredTestimonial(null); }}
        style={{ overflowX: 'hidden', cursor: 'default' }}
        className="flex gap-4"
      >
        {items.map((t, i) => {
          const realIdx = i % testimonials.length;
          const isActive = hoveredTestimonial === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredTestimonial(i)}
              style={{ width: 300, minWidth: 300, minHeight: 220 }}
              className={`rounded-2xl p-6 flex flex-col justify-between shrink-0 transition-all duration-300 ${
                isActive
                  ? 'bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 dark:border-white/10'
                  : 'bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10'
              }`}
            >
              <p className={`text-sm leading-relaxed ${isActive ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className={`mt-5 pt-4 border-t ${isActive ? 'border-white/15' : 'border-zinc-100 dark:border-white/10'}`}>
                <p className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>{t.name}</p>
                <p className="text-xs mt-0.5 text-zinc-400">{t.role}</p>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [playlist, setPlaylist]   = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq]     = useState<number | null>(null);
  const [hoveredTestimonial, setHoveredTestimonial] = useState<number | null>(null);

  const router = useRouter();
  const { status } = useSession();

  const handleSearch = async (query: string, language: string, difficulty: string) => {
    setIsLoading(true); setError(''); setPlaylist(null);
    try {
      const res = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query, language, difficulty }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      if (data.playlist) {
        try {
          const saveRes = await fetch('/api/playlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ title: `Learning Path: ${query}`, description: `AI-curated learning path for ${query} (${language}, ${difficulty})`, videos: data.playlist }) });
          if (saveRes.ok) { const saved = await saveRes.json(); router.push(`/playlist/${saved.id}`); return; }
          setPlaylist(data.playlist);
        } catch { setPlaylist(data.playlist); }
      } else { setError(data.message || 'No videos found.'); }
    } catch { setError('Failed to search. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleVideoPlay = (videoId: string) => {
    if (playlist) localStorage.setItem('neuro_playlist', JSON.stringify(playlist));
    router.push(`/watch?v=${videoId}`);
  };

  const tab = WHY_TABS[activeTab];

  // Duplicate testimonials for seamless marquee loop
return (
    <div className="min-h-screen relative z-10">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Hyperspeed
          effectOptions={{
            onSpeedUp: () => { },
            onSlowDown: () => { },
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
      <Navbar />

      {/* ── HERO ───────── */}
      {!playlist && !isLoading && !error && (
        <div className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-8 min-h-[calc(100vh-65px)] flex flex-col justify-center">
          <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 px-2">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">AI-Powered Learning</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
              Learn Anything with
              <span className="text-primary"> Intelligent</span> Curation
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Discover personalized learning paths with AI-curated YouTube content.
              Get structured playlists, summaries, and quizzes tailored to your learning style.
            </p>
          </div>
          <div className="mb-10 sm:mb-16">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* ── LOADING ────────────────────────────────────────── */}
      {isLoading && (
        <div className="relative z-10 container mx-auto px-4 min-h-[calc(100vh-65px)] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center p-10 sm:p-14 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-500 max-w-lg w-full mx-auto">
            <div className="relative w-24 h-24 flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-zinc-400/20 dark:bg-white/10 blur-2xl rounded-full animate-pulse" />
              <div className="absolute inset-0 border-[3px] border-zinc-200 dark:border-white/10 rounded-full" />
              <div className="absolute inset-0 border-[3px] border-zinc-900 dark:border-white rounded-full border-t-transparent animate-spin duration-1000" />
              <Sparkles className="h-8 w-8 text-zinc-900 dark:text-white animate-pulse" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3 text-center">
              Curating Your Learning Path
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-sm text-sm sm:text-base leading-relaxed">
              Our AI is analyzing top content to build the perfect personalized curriculum for you...
            </p>
          </div>
        </div>
      )}

      {/* ── ERROR ──────────────────────────────────────────── */}
      {error && (
        <div className="container mx-auto px-4 text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive font-bold text-xl">!</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Search Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => setError('')}>Try Again</Button>
          </div>
        </div>
      )}

      {/* ── PLAYLIST ───────────────────────────────────────── */}
      {playlist && !isLoading && (
        <div className="relative z-10 bg-white dark:bg-[#09090b] min-h-[calc(100vh-65px)] w-full">
          <div className="container mx-auto px-4 py-10 sm:py-16">
            <PlaylistGrid playlist={playlist} onVideoPlay={handleVideoPlay} onBookmarkPlaylist={() => {}} />
          </div>
        </div>
      )}

      {/* ══ MARKETING SECTIONS ══════════════════════════════ */}
      {!playlist && !isLoading && !error && (
        <div className="bg-white dark:bg-[#09090b] overflow-x-hidden">

          {/* 1. TOPICS STRIP */}
          <section id="features" className="border-b border-zinc-200 dark:border-white/10 py-10 px-6">
            <AnimateSection>
              <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mb-7 uppercase tracking-widest font-medium">
                Explore topics across every field
              </p>
              <div className="flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto">
                {TOPICS.map((topic, i) => (
                  <AnimateSection key={topic} delay={i * 40}>
                    <button
                      onClick={() => handleSearch(topic, 'Any', 'Beginner')}
                      className="flex items-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-800 dark:text-white transition-all hover:border-zinc-300 dark:hover:border-white/25 hover:scale-[1.03] active:scale-[0.97]"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                      {topic}
                    </button>
                  </AnimateSection>
                ))}
              </div>
            </AnimateSection>
          </section>

          {/* 2. WHY NEUROLEARN */}
          <section id="how-it-works" className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
              <AnimateSection className="text-center mb-12">
                <SectionLabel>Why NeuroLearn</SectionLabel>
                <SectionHeading>Built different.<br />Learns with you.</SectionHeading>
                <SectionSub>Every feature is designed to make self-directed learning faster, more structured, and actually stick.</SectionSub>
              </AnimateSection>

              <AnimateSection delay={100}>
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {WHY_TABS.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(i)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeTab === i
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                          : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 hover:text-zinc-800 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-8 md:p-10 grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white mb-3 leading-snug">{tab.heading}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-7">{tab.body}</p>
                    <Link href={status === 'authenticated' ? '/dashboard' : '/auth/signup'}>
                      <button className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                        Get Started <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                  <ul className="space-y-3.5">
                    {tab.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-zinc-700 dark:text-white" />
                        </div>
                        <span className="text-zinc-600 dark:text-zinc-300 text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateSection>
            </div>
          </section>

          {/* 3. LEARNING PATHS */}
          <section className="py-24 px-6 border-t border-zinc-200 dark:border-white/10">
            <div className="max-w-5xl mx-auto">
              <AnimateSection className="text-center mb-12">
                <SectionLabel>Learning Paths</SectionLabel>
                <SectionHeading>Pick a path.<br />Start in seconds.</SectionHeading>
                <SectionSub>Click any path and our AI instantly builds a structured playlist from beginner to advanced.</SectionSub>
              </AnimateSection>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {LEARNING_PATHS.map(({ title, desc, icon: Icon }, i) => (
                  <AnimateSection key={title} delay={i * 80}>
                    <button
                      onClick={() => handleSearch(title, 'Any', 'Beginner')}
                      className="group w-full text-left bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98] h-full"
                    >
                      <div className="flex items-start justify-between mb-10">
                        <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-zinc-500 dark:text-white/70" />
                        </div>
                        <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-white/10 group-hover:bg-zinc-900 dark:group-hover:bg-white flex items-center justify-center transition-all">
                          <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-black transition-colors" />
                        </div>
                      </div>
                      <h3 className="text-zinc-900 dark:text-white font-semibold text-sm mb-1">{title}</h3>
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs">{desc}</p>
                    </button>
                  </AnimateSection>
                ))}
              </div>

              <AnimateSection delay={200} className="flex justify-center mt-8">
                <Link href={status === 'authenticated' ? '/dashboard' : '/auth/signup'}>
                  <button className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full px-6 py-3 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                    See All Topics <ArrowUpRight className="h-4 w-4" />
                  </button>
                </Link>
              </AnimateSection>
            </div>
          </section>

          {/* 4. STATS */}
          <section className="py-24 px-6 border-t border-zinc-200 dark:border-white/10">
            <div className="max-w-5xl mx-auto">
              <AnimateSection className="text-center mb-14">
                <SectionHeading>The numbers speak<br />for themselves.</SectionHeading>
                <SectionSub>NeuroLearn is built for learners who take their growth seriously — structured, measurable, and fast.</SectionSub>
              </AnimateSection>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STATS.map(({ num, label, body }, i) => (
                  <AnimateSection key={label} delay={i * 100}>
                    {/* Dark card on light bg, white card on dark bg — always high contrast */}
                    <div className="bg-zinc-900 dark:bg-white rounded-2xl p-7 flex flex-col justify-between min-h-[260px]">
                      <p className="text-zinc-400 dark:text-zinc-500 text-sm leading-relaxed">{body}</p>
                      <div className="mt-6">
                        <p className="text-4xl font-bold text-white dark:text-black">{num}</p>
                        <p className="text-sm font-medium text-zinc-500 mt-1">{label}</p>
                      </div>
                    </div>
                  </AnimateSection>
                ))}
              </div>
            </div>
          </section>

          {/* 5. UNIQUE FEATURES */}
          <section className="py-24 px-6 border-t border-zinc-200 dark:border-white/10">
            <div className="max-w-5xl mx-auto">
              <AnimateSection className="text-center mb-14">
                <SectionLabel>What Makes Us Unique</SectionLabel>
                <SectionHeading>Everything you need.<br />Nothing you don't.</SectionHeading>
                <SectionSub>Six features working together so you spend time learning — not figuring out where to start.</SectionSub>
              </AnimateSection>

              <AnimateSection delay={100}>
                <div className="grid grid-cols-3 gap-3 items-stretch">
                  <div className="flex flex-col gap-3">
                    {UNIQUE_FEATURES.slice(0, 3).map(({ title, desc }) => (
                      <div key={title} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-zinc-400 dark:text-white/50 shrink-0" />
                          <h4 className="text-zinc-900 dark:text-white font-semibold text-sm">{title}</h4>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-500 text-xs leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-zinc-900 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <GraduationCap className="h-8 w-8 text-black" />
                      </div>
                      <p className="text-white font-semibold text-lg">NeuroLearn</p>
                      <p className="text-zinc-500 text-xs mt-0.5">AI-Powered Learning</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {UNIQUE_FEATURES.slice(3).map(({ title, desc }) => (
                      <div key={title} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-zinc-400 dark:text-white/50 shrink-0" />
                          <h4 className="text-zinc-900 dark:text-white font-semibold text-sm">{title}</h4>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-500 text-xs leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimateSection>
            </div>
          </section>

          {/* 6. TESTIMONIALS */}
          <TestimonialsSection
            testimonials={TESTIMONIALS}
            hoveredTestimonial={hoveredTestimonial}
            setHoveredTestimonial={setHoveredTestimonial}
          />

          {/* 7. FAQ */}
          <section id="faq" className="py-24 px-6 border-t border-zinc-200 dark:border-white/10">
            <div className="max-w-3xl mx-auto">
              <AnimateSection className="text-center mb-14">
                <SectionLabel>FAQ</SectionLabel>
                <SectionHeading>Frequently asked<br />questions.</SectionHeading>
                <SectionSub>Quick answers to the most common questions about NeuroLearn.</SectionSub>
              </AnimateSection>

              <div className="space-y-2.5">
                {FAQS.map((faq, i) => (
                  <AnimateSection key={i} delay={i * 60}>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between px-6 py-5 text-left group"
                      >
                        <span className="text-zinc-800 dark:text-white font-medium text-sm pr-4">{faq.q}</span>
                        <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-white/10 group-hover:bg-zinc-200 dark:group-hover:bg-white/15 flex items-center justify-center shrink-0 transition-colors">
                          {openFaq === i
                            ? <Minus className="h-3.5 w-3.5 text-zinc-700 dark:text-white" />
                            : <Plus className="h-3.5 w-3.5 text-zinc-700 dark:text-white" />}
                        </div>
                      </button>
                      {openFaq === i && (
                        <div className="px-6 pb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="border-t border-zinc-100 dark:border-white/10 pt-4">
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </AnimateSection>
                ))}
              </div>
            </div>
          </section>

          {/* 8. BOTTOM CTA */}
          <section className="py-24 px-6 border-t border-zinc-200 dark:border-white/10">
            <AnimateSection className="max-w-2xl mx-auto text-center">
              <div className="h-14 w-14 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-7">
                <GraduationCap className="h-8 w-8 text-white dark:text-black" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-3">Start Learning Today</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-9">
                Your AI-powered learning companion is ready. Search any topic and get a structured
                playlist from beginner to advanced in seconds — completely free.
              </p>
              <Link href={status === 'authenticated' ? '/dashboard' : '/auth/signup'}>
                <button className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full px-7 py-3.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all mx-auto">
                  {status === 'authenticated' ? 'Go to Dashboard' : 'Create Free Account'}
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </Link>
            </AnimateSection>
          </section>

          {/* 9. FOOTER */}
          <footer className="border-t border-zinc-200 dark:border-white/10 px-6 pt-14 pb-10">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-white dark:text-black" />
                    </div>
                    <span className="text-zinc-900 dark:text-white font-semibold">NeuroLearn</span>
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-5 max-w-xs">
                    AI-curated learning paths, streak tracking, mock interviews, and quizzes — all free.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-colors"
                    />
                    <button className="bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-colors shrink-0">
                      Subscribe
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-4">Navigate</p>
                  <ul className="space-y-2.5">
                    {[{ label: 'Home', href: '/' }, { label: 'Dashboard', href: '/dashboard' }, { label: 'Sign In', href: '/auth/signin' }, { label: 'Sign Up', href: '/auth/signup' }].map(({ label, href }) => (
                      <li key={label}><Link href={href} className="text-zinc-500 dark:text-zinc-400 text-sm hover:text-zinc-900 dark:hover:text-white transition-colors">{label}</Link></li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-4">Resources</p>
                  <ul className="space-y-2.5">
                    {[{ label: 'FAQ', href: '#faq' }, { label: 'Privacy Policy', href: '#' }, { label: 'Terms of Use', href: '#' }].map(({ label, href }) => (
                      <li key={label}><Link href={href} className="text-zinc-500 dark:text-zinc-400 text-sm hover:text-zinc-900 dark:hover:text-white transition-colors">{label}</Link></li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-white/10 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-zinc-400 text-xs">&copy; {new Date().getFullYear()} NeuroLearn. All rights reserved.</p>
                <p className="text-zinc-400 text-xs">Built with AI. Powered by curiosity.</p>
              </div>
            </div>
          </footer>

        </div>
      )}
    </div>
  );
}
