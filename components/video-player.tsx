'use client';

import { useState, useEffect } from 'react';
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
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          watchTime: 0, // You can pass actual watch time if tracked
          completed: true,
        }),
      });
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
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
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
          
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold mb-2">{title}</h1>
                <p className="text-muted-foreground mb-2">{channelTitle}</p>
                <Badge className={`${getDifficultyColor(difficulty)} text-white text-xs`}>
                  <BookOpen className="h-3 w-3 mr-1" />
                  {difficulty}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                {onComplete && (
                  <Button onClick={handleComplete} variant="outline">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                )}
                {onNext && (
                  <Button onClick={onNext}>
                    Next Video
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Tabs for additional content */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">
            <Brain className="h-4 w-4 mr-2" />
            AI Summary
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Knowledge Check
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            My Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Generated Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Knowledge Check
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                                    ? 'bg-green-100 border-green-500 text-green-700'
                                    : 'bg-red-100 border-red-500 text-red-700'
                                  : 'bg-primary/10 border-primary'
                                : quizSubmitted && oIndex === question.correctAnswer
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'hover:bg-muted'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>

                      {quizSubmitted && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">{question.explanation}</p>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take notes while watching the video..."
                className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="mt-3">Save Notes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}