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
  createdAt: string | Date;
  createdBy: string;
  jsonMockResp?: string;
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

  useEffect(() => {
    loadInterviews();
  }, []);

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
      {interviews.map((interview) => (
        <Link key={interview.mockId} href={`/dashboard/interview/${interview.mockId}`}>
          <Card className="cursor-pointer border border-border shadow-sm hover:shadow-lg hover:border-primary transition-all duration-300 h-full">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate text-foreground hover:text-primary transition-colors">
                    {interview.jobPosition}
                  </h3>
                  {interview.jobDesc && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{interview.jobDesc}</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
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
                  <ArrowRight className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
