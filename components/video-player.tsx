'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, BookOpen, Brain, FileText } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  difficulty: string;
  onComplete?: () => void;
  onNext?: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export function VideoPlayer({ 
  videoId, 
  title, 
  description, 
  channelTitle, 
  difficulty,
  onComplete,
  onNext
}: VideoPlayerProps) {
  const { data: session } = useSession() as { data: { user: { id: string } } | null };
  const [summary, setSummary] = useState<string>('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadAIContent();
  }, [videoId]);

  const loadAIContent = async () => {
    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/video/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary || 'Summary unavailable.');
        setQuiz(data.quiz || []);
      }
    } catch (error) {
      console.error('Failed to load AI content:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Add handler to save history when completed
  const handleComplete = async () => {
    if (!session?.user?.id) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Save completion history
      const historyResponse = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          watchTime: 0, // You can pass actual watch time if tracked
          completed: true,
        }),
      });

      // Award blockchain badge for first video completion
      if (historyResponse.ok) {
        try {
          await fetch('/api/badge/award', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: session.user.id, // Use actual user ID from session
              moduleId: 'blockchain-basics',
              title: '🚀 Blockchain Explorer',
              description: 'Completed your first blockchain learning video! Welcome to the decentralized future.',
              imageUrl: 'https://via.placeholder.com/64/4F46E5/FFFFFF?text=🚀',
            }),
          });
          console.log('Blockchain badge awarded!');
        } catch (badgeError) {
          console.error('Failed to award badge:', badgeError);
        }
      }

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500 dark:bg-green-600';
      case 'intermediate': return 'bg-yellow-500 dark:bg-yellow-600';
      case 'advanced': return 'bg-red-500 dark:bg-red-600';
      default: return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Video Player */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <div className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-bold mb-2">{title}</h1>
                <p className="text-sm sm:text-base text-muted-foreground mb-2">{channelTitle}</p>
                <Badge className={`${getDifficultyColor(difficulty)} text-white text-xs`}>
                  <BookOpen className="h-3 w-3 mr-1" />
                  {difficulty}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                {onComplete && (
                  <Button onClick={handleComplete} variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Complete</span>
                    <span className="sm:hidden">Done</span>
                  </Button>
                )}
                {onNext && (
                  <Button onClick={onNext} size="sm" className="flex-1 sm:flex-none">
                    <span className="hidden sm:inline">Next Video</span>
                    <span className="sm:hidden">Next</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Tabs for additional content */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="summary" className="text-xs sm:text-sm py-2 px-1 sm:px-4">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">AI Summary</span>
            <span className="sm:hidden">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="text-xs sm:text-sm py-2 px-1 sm:px-4">
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Knowledge Check</span>
            <span className="sm:hidden">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm py-2 px-1 sm:px-4">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">My Notes</span>
            <span className="sm:hidden">Notes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                AI-Generated Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {isLoadingAI ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  <span>Generating summary...</span>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                Knowledge Check
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {isLoadingAI ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  <span>Generating quiz...</span>
                </div>
              ) : quiz.length > 0 ? (
                <div className="space-y-6">
                  {quiz.map((question, qIndex) => (
                    <div key={qIndex} className="space-y-3">
                      <h3 className="font-semibold">{question.question}</h3>
                      
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <button
                            key={oIndex}
                            onClick={() => 
                              setSelectedAnswers(prev => ({ ...prev, [qIndex]: oIndex }))
                            }
                            disabled={quizSubmitted}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedAnswers[qIndex] === oIndex 
                                ? quizSubmitted
                                  ? oIndex === question.correctAnswer
                                    ? 'bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700 text-green-700 dark:text-green-200'
                                    : 'bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-700 text-red-700 dark:text-red-200'
                                  : 'bg-primary/10 border-primary'
                                : quizSubmitted && oIndex === question.correctAnswer
                                ? 'bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700 text-green-700 dark:text-green-200'
                                : 'hover:bg-muted'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>

                      {quizSubmitted && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-200">{question.explanation}</p>
                        </div>
                      )}
                      
                      {qIndex < quiz.length - 1 && <Separator />}
                    </div>
                  ))}
                  
                  {!quizSubmitted && (
                    <Button onClick={handleQuizSubmit} className="w-full">
                      Submit Quiz
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Quiz questions will appear here after generation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                My Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take notes while watching the video..."
                className="w-full h-32 sm:h-40 p-3 border rounded-lg resize-none bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              />
              <Button className="mt-3">Save Notes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}