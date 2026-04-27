'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Briefcase, ArrowRight } from 'lucide-react';

interface Interview {
  id: number;
  mockId: string;
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  createdAt: string;
  createdBy: string;
  jsonMockResp?: string;
  userAnswers?: any[];
}

interface InterviewListProps {
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function InterviewList({ isLoading = false, error = null, onRefresh }: InterviewListProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const loadInterviews = async () => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      
      const response = await fetch('/api/interview/list', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch interviews');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.result)) {
        setInterviews(data.result);
      } else {
        setInterviews([]);
      }
    } catch (err) {
      console.error('Failed to load interviews:', err);
      setLocalError('Failed to load interviews');
      setInterviews([]);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, mockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this interview?')) return;
    try {
      const res = await fetch(`/api/interview/${mockId}`, { method: 'DELETE' });
      if (res.ok) {
        setInterviews(prev => prev.filter(i => i.mockId !== mockId));
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to delete interview');
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [isLoading]); // Reload if parent triggers isLoading

  const displayLoading = isLoading || localLoading;
  const displayError = error || localError;

  if (displayLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <p className="text-muted-foreground">Loading interviews...</p>
        </CardContent>
      </Card>
    );
  }

  if (displayError) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <p className="text-destructive font-medium">{displayError}</p>
        </CardContent>
      </Card>
    );
  }

  if (interviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground">No interviews yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create a new interview to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {interviews.map((interview) => {
        let scoreDisplay = null;
        let validRatings = 0;
        if (interview.userAnswers && interview.userAnswers.length > 0) {
          let totalScore = 0;
          const latestAnswers: Record<string, any> = {};
          
          // Group by question and get the latest
          interview.userAnswers.forEach(ans => {
            latestAnswers[ans.question] = ans;
          });

          Object.values(latestAnswers).forEach(ans => {
            if (ans.rating) {
              const match = ans.rating.match(/(\d+)/);
              if (match) {
                const score = parseInt(match[1]);
                if (score <= 10) {
                  totalScore += score;
                  validRatings++;
                }
              }
            }
          });
          if (validRatings > 0) {
            const avg = Math.round((totalScore / validRatings) * 10) / 10;
            scoreDisplay = (
              <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded font-medium ml-auto text-xs">
                Score: {avg}/10
              </span>
            );
          }
        }

        return (
          <div key={interview.mockId} className="relative group/card h-full">
            {/* Delete Button */}
            <button 
              onClick={(e) => handleDelete(e, interview.mockId)}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white dark:bg-red-900/30 dark:hover:bg-red-600 opacity-0 group-hover/card:opacity-100 transition-all duration-200"
              title="Delete Interview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
            <Link href={`/dashboard/interview/${interview.mockId}${validRatings > 0 ? '/feedback' : ''}`} className="h-full block">
              <Card className="cursor-pointer border border-border shadow-sm hover:shadow-lg hover:border-primary transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex flex-col gap-4 flex-1">
                    <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                      <div className="min-w-0 pr-8">
                        <h3 className="font-bold text-base truncate text-foreground hover:text-primary transition-colors">
                          {interview.jobPosition}
                        </h3>
                      {interview.jobDesc && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{interview.jobDesc}</p>
                      )}
                    </div>
                    {scoreDisplay}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                        <Briefcase className="h-3 w-3" />
                        {interview.jobExperience} yrs
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        <Clock className="h-3 w-3" />
                        {new Date(interview.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          </div>
        );
      })}
    </div>
  );
}
