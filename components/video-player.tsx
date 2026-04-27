'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, BookOpen, Brain, FileText, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  difficulty: string;
  playlistId?: string;
  onComplete?: () => void;
  onNext?: () => void;
  onVideoCompleted?: (videoId: string) => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Flashcard {
  front: string;
  back: string;
}

export function VideoPlayer({
  videoId,
  title,
  description,
  channelTitle,
  difficulty,
  playlistId,
  onComplete,
  onNext,
  onVideoCompleted,
}: VideoPlayerProps) {
  const { data: session } = useSession() as { data: { user: { id: string; email?: string } } | null };
  const playerRef = useRef<any>(null);
  const playerInitialized = useRef(false);
  const historyRecorded = useRef(false);

  const [summary, setSummary] = useState<string>('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Load AI content + notes on video change
  useEffect(() => {
    setSummary('');
    setQuiz([]);
    setFlashcards([]);
    setFlippedCards(new Set());
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setNotes('');
    setCompleted(false);
    loadAIContent();
    loadNotes();
  }, [videoId]);

  // Auto-save notes with 1.5s debounce
  useEffect(() => {
    if (!notes) return;
    setNotesSaved(false);
    const timer = setTimeout(() => saveNotes(), 1500);
    return () => clearTimeout(timer);
  }, [notes]);

  // YouTube IFrame API
  useEffect(() => {
    playerInitialized.current = false;

    const initPlayer = () => {
      if (playerInitialized.current) return;
      playerInitialized.current = true;
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: any) => {
            if (event.data === 1 && !historyRecorded.current) {
              // 1 is YT.PlayerState.PLAYING
              historyRecorded.current = true;
              recordHistory(false);
            }
            if (event.data === 0) handleComplete(); // video ended
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
        playerInitialized.current = false;
      }
    };
  }, [videoId]);

  const loadAIContent = async () => {
    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/video/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, description, videoId }),
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary || 'Summary unavailable.');
        setQuiz(data.quiz || []);
        setFlashcards(data.flashcards || []);
      }
    } catch (error) {
      console.error('Failed to load AI content:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const loadNotes = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`/api/notes?videoId=${videoId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.content ?? '');
      }
    } catch {}
  };

  const saveNotes = async () => {
    if (!session?.user?.id) return;
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ youtubeId: videoId, content: notes }),
      });
      setNotesSaved(true);
    } catch {}
  };

  const recordHistory = useCallback(async (isCompleted: boolean) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ videoId, watchTime: 0, completed: isCompleted, title, description }),
      });
    } catch {}
  }, [videoId, title, description]);

  const handleComplete = useCallback(async () => {
    if (completed) return;
    setCompleted(true);

    await recordHistory(true);

    // Update playlist progress
    if (playlistId) {
      try {
        await fetch(`/api/playlist/${playlistId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ completedVideoId: videoId }),
        });
      } catch {}
    }

    if (onVideoCompleted) onVideoCompleted(videoId);
    if (onComplete) onComplete();
  }, [completed, videoId, playlistId, onVideoCompleted, onComplete, recordHistory]);

  const handleQuizSubmit = async () => {
    setQuizSubmitted(true);
    const score = quiz.filter((q, i) => selectedAnswers[i] === q.correctAnswer).length;
    setQuizScore(score);

    if (session?.user?.id) {
      try {
        await fetch('/api/quiz/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ youtubeId: videoId, score, total: quiz.length }),
        });
      } catch {}
    }
  };

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'intermediate': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'advanced': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="bg-black border border-zinc-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="aspect-video relative w-full">
          <div id={`yt-player-${videoId}`} className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      {/* Video Details */}
      <div className="px-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
        <div className="flex-1 space-y-3">
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-md font-bold border backdrop-blur-md ${getDifficultyStyles(difficulty)}`}>
            {difficulty}
          </Badge>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">{title}</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{channelTitle}</p>
        </div>

        <div className="flex gap-3 shrink-0">
          {onComplete && (
            <Button
              onClick={handleComplete}
              variant={completed ? 'default' : 'outline'}
              className={`h-11 rounded-xl font-semibold transition-all shadow-sm ${
                completed 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 backdrop-blur-md'
              }`}
              disabled={completed}
            >
              <CheckCircle2 className={`h-4 w-4 mr-2 ${completed ? 'fill-white/20' : ''}`} />
              <span>{completed ? 'Completed' : 'Mark as Complete'}</span>
            </Button>
          )}
          {onNext && (
            <Button onClick={onNext} className="h-11 rounded-xl font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-md">
              Next Video
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-zinc-200 dark:border-white/10 shadow-sm">
          <TabsTrigger value="summary" className="rounded-[1rem] data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-2.5 px-1 sm:px-4 text-zinc-600 dark:text-zinc-400 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 font-medium">
            <Brain className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">AI Summary</span>
            <span className="sm:hidden">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="rounded-[1rem] data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-2.5 px-1 sm:px-4 text-zinc-600 dark:text-zinc-400 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 font-medium">
            <BookOpen className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Flashcards</span>
            <span className="sm:hidden">Cards</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-[1rem] data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-2.5 px-1 sm:px-4 text-zinc-600 dark:text-zinc-400 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 font-medium">
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Knowledge Check</span>
            <span className="sm:hidden">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-[1rem] data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-2.5 px-1 sm:px-4 text-zinc-600 dark:text-zinc-400 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 font-medium">
            <FileText className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">My Notes</span>
            <span className="sm:hidden">Notes</span>
          </TabsTrigger>
        </TabsList>

        {/* Summary */}
        <TabsContent value="summary" className="mt-4">
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
              <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <Brain className="h-5 w-5 text-primary" />
                AI-Generated Summary
              </h3>
            </div>
            <div className="p-6 sm:p-8">
              {isLoadingAI ? (
                <div className="flex items-center gap-3 text-zinc-500 font-medium">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  Generating comprehensive summary...
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-white prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-li:text-zinc-600 dark:prose-li:text-zinc-400 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-200 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Flashcards */}
        <TabsContent value="flashcards" className="mt-4">
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
              <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <BookOpen className="h-5 w-5 text-primary" />
                Flashcards
                {flashcards.length > 0 && (
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-2">({flashcards.length} cards)</span>
                )}
              </h3>
            </div>
            <div className="p-6 sm:p-8">
              {isLoadingAI ? (
                <div className="flex items-center gap-3 text-zinc-500 font-medium">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  Generating flashcards...
                </div>
              ) : flashcards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {flashcards.map((card, i) => (
                    <button
                      key={i}
                      onClick={() => setFlippedCards(prev => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })}
                      className="relative min-h-[160px] rounded-2xl transition-all text-left group perspective-1000"
                      style={{ perspective: '1000px' }}
                    >
                      <div
                        className="w-full h-full transition-transform duration-500 relative"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: flippedCards.has(i) ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          minHeight: '160px',
                        }}
                      >
                        {/* Front */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-2xl group-hover:border-primary/50 shadow-sm" style={{ backfaceVisibility: 'hidden' }}>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Question</span>
                          <p className="text-[15px] font-medium leading-relaxed text-zinc-900 dark:text-zinc-100">{card.front}</p>
                          <span className="text-[10px] font-medium text-zinc-400">Click to reveal</span>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-between bg-primary/5 border border-primary/20 rounded-2xl shadow-sm" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Answer</span>
                          <p className="text-[15px] font-medium leading-relaxed text-zinc-900 dark:text-zinc-100">{card.back}</p>
                          <span className="text-[10px] font-medium text-zinc-400">Click to flip back</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 font-medium">Flashcards will appear here after generation.</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Quiz */}
        <TabsContent value="quiz" className="mt-4">
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
              <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Knowledge Check
              </h3>
            </div>
            <div className="p-6 sm:p-8">
              {isLoadingAI ? (
                <div className="flex items-center gap-3 text-zinc-500 font-medium">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  Generating quiz...
                </div>
              ) : quiz.length > 0 ? (
                <div className="space-y-8">
                  {quizSubmitted && quizScore !== null && (
                    <div className={`p-6 rounded-2xl border text-center backdrop-blur-sm shadow-sm ${
                      quizScore / quiz.length >= 0.7
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      <p className="text-3xl font-extrabold mb-1">{quizScore} / {quiz.length}</p>
                      <p className="text-sm font-medium">
                        {Math.round((quizScore / quiz.length) * 100)}% — {quizScore / quiz.length >= 0.7 ? '🎉 Great work!' : '📚 Keep practicing'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 border-zinc-200 dark:border-white/10"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizScore(null);
                          setSelectedAnswers({});
                        }}
                      >
                        Retake Quiz
                      </Button>
                    </div>
                  )}
                  {quiz.map((question, qIndex) => (
                    <div key={qIndex} className="space-y-4">
                      <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 leading-relaxed">
                        <span className="text-primary mr-2">{qIndex + 1}.</span> 
                        {question.question}
                      </h3>
                      <div className="space-y-2.5">
                        {question.options.map((option, oIndex) => {
                          const isSelected = selectedAnswers[qIndex] === oIndex;
                          const isCorrect = oIndex === question.correctAnswer;
                          
                          let btnClass = "w-full text-left p-4 rounded-xl border transition-all text-sm font-medium shadow-sm ";
                          if (!quizSubmitted) {
                            btnClass += isSelected 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800";
                          } else {
                            if (isSelected && isCorrect) {
                              btnClass += "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
                            } else if (isSelected && !isCorrect) {
                              btnClass += "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300";
                            } else if (isCorrect) {
                              btnClass += "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
                            } else {
                              btnClass += "bg-white/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-white/5 text-zinc-400 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={oIndex}
                              onClick={() => !quizSubmitted && setSelectedAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                              disabled={quizSubmitted}
                              className={btnClass}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            <span className="font-bold text-primary mr-2">Explanation:</span>
                            {question.explanation}
                          </p>
                        </div>
                      )}
                      {qIndex < quiz.length - 1 && <Separator className="my-8 opacity-50" />}
                    </div>
                  ))}
                  {!quizSubmitted && (
                    <Button
                      onClick={handleQuizSubmit}
                      className="w-full h-12 rounded-xl text-base font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-md mt-6"
                      disabled={Object.keys(selectedAnswers).length < quiz.length}
                    >
                      Submit Quiz ({Object.keys(selectedAnswers).length}/{quiz.length} answered)
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-zinc-500 font-medium">Quiz questions will appear here after generation.</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <FileText className="h-5 w-5 text-primary" />
                My Notes
              </h3>
              {notesSaved && (
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full">
                  <Save className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
                placeholder={session?.user?.id ? 'Take notes while watching... (auto-saved)' : 'Sign in to save notes'}
                disabled={!session?.user?.id}
                className="w-full min-h-[200px] p-5 border border-zinc-200 dark:border-white/10 rounded-2xl resize-y bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 font-medium placeholder:text-zinc-400 transition-all shadow-inner"
              />
              {!session?.user?.id && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> Notes are saved per video when signed in.
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
