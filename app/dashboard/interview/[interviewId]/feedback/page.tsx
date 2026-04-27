"use client";
import React, { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface UserAnswerData {
  id: number;
  mockIdRef: string;
  question: string;
  correctAns: string | null;
  userAns: string | null;
  feedback: string | null;
  rating: string | null;
  userEmail: string | null;
  createdAt: string | null;
}

type FeedbackProps = {
  params: { interviewId: string };
};

const Feedback: React.FC<FeedbackProps> = ({ params }) => {
  const [feedbackList, setFeedbackList] = useState<UserAnswerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const interviewId: string = params.interviewId;

  useEffect(() => {
    const GetFeedback = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const resp = await fetch(`/api/interview/feedback?mockIdRef=${interviewId}`);
        const data = await resp.json();
        if (data.success && Array.isArray(data.result)) {
          setFeedbackList(data.result as UserAnswerData[]);
        } else {
          setFeedbackList([]);
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setIsLoading(false);
      }
    };
    GetFeedback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const handleGoHome = (): void => {
    router.replace("/dashboard");
  };

  const getProcessedFeedback = () => {
    // Group by question
    const grouped: Record<string, UserAnswerData[]> = {};
    feedbackList.forEach(item => {
      if (!grouped[item.question]) {
        grouped[item.question] = [];
      }
      grouped[item.question].push(item);
    });

    const processed: {
      current: UserAnswerData;
      previous: UserAnswerData | null;
      improvement: number | null;
    }[] = [];

    let currentScoreTotal = 0;
    let validCurrentRatings = 0;

    const parseScore = (rating: string | null) => {
      if (!rating) return null;
      const match = rating.match(/(\d+)/);
      return match ? parseInt(match[1]) : null;
    };

    Object.values(grouped).forEach(history => {
      const current = history[history.length - 1];
      const previous = history.length > 1 ? history[history.length - 2] : null;
      
      const currentScore = parseScore(current.rating);
      const previousScore = previous ? parseScore(previous.rating) : null;
      
      let improvement = null;
      if (currentScore !== null && previousScore !== null) {
        improvement = currentScore - previousScore;
      }

      if (currentScore !== null && currentScore <= 10) {
        currentScoreTotal += currentScore;
        validCurrentRatings++;
      }
      
      processed.push({ current, previous, improvement });
    });

    const currentAvg = validCurrentRatings > 0 ? Math.round((currentScoreTotal / validCurrentRatings) * 10) / 10 : 0;

    return { processed, currentAvg };
  };

  const { processed, currentAvg } = getProcessedFeedback();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-10 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-zinc-500 font-medium">Loading your detailed feedback report...</p>
      </div>
    );
  }

  const handleRetake = (): void => {
    router.push(`/dashboard/interview/${interviewId}`);
  };

  return (
    <div className="p-4 sm:p-10">
      {processed.length === 0 ? (
        <h2 className="font-bold text-lg sm:text-xl text-gray-500">
          No Interview Feedback Record Found
        </h2>
      ) : (
        <>
          <div className="mb-8 sm:mb-10 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Interview Complete</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4 mb-6">
                <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl inline-flex items-center gap-3 w-fit">
                  <span className="text-sm font-semibold uppercase tracking-wider">Overall Score</span>
                  <span className="text-3xl font-bold">{currentAvg}<span className="text-lg opacity-70">/10</span></span>
                </div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base">
              Here is your detailed feedback report with AI ratings and improvement areas.
            </p>
          </div>
          {processed.map((item, index) => (
            <Collapsible key={index} className="mt-4 sm:mt-7">
              <CollapsibleTrigger className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl flex justify-between my-2 text-left gap-4 sm:gap-6 w-full text-sm sm:text-base font-medium text-zinc-900 dark:text-white shadow-sm hover:border-zinc-300 dark:hover:border-white/20 transition-all">
                <span className="line-clamp-2 sm:line-clamp-none">{item.current.question}</span>
                <div className="flex items-center gap-3">
                  {item.improvement !== null && (
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${item.improvement > 0 ? 'bg-green-100 text-green-700' : item.improvement < 0 ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'}`}>
                      {item.improvement > 0 ? '+' : ''}{item.improvement} score
                    </span>
                  )}
                  <ChevronsUpDown className="h-5 w-5 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-3 mt-3">
                  <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-sm sm:text-base text-zinc-900 dark:text-white font-medium mb-1 uppercase tracking-wider text-xs">Current Rating</h2>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-white">{item.current.rating || 'Not rated'}</p>
                    </div>
                    {item.previous && (
                    <div className="text-right opacity-70">
                        <h2 className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Previous Rating</h2>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{item.previous.rating || 'Not rated'}</p>
                    </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-white dark:bg-zinc-900">
                        <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Your Latest Answer</h2>
                        <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">{item.current.userAns || 'No answer provided'}</p>
                    </div>
                    {item.previous && (
                    <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 opacity-80">
                        <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Your Previous Answer</h2>
                        <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed italic">{item.previous.userAns || 'No answer provided'}</p>
                    </div>
                    )}
                  </div>
                  
                  <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                    <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Expected Answer</h2>
                    <p className="text-sm sm:text-base text-zinc-900 dark:text-white leading-relaxed">{item.current.correctAns || 'No correct answer available'}</p>
                  </div>
                  
                  <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                    <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">AI Feedback</h2>
                    <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed">{item.current.feedback || 'No feedback available'}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </>
      )}
      <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleRetake}
          className="bg-primary text-primary-foreground hover:opacity-90 font-medium px-8 py-2.5 rounded-xl shadow-md w-full sm:w-auto"
        >
          Retake Interview
        </Button>
        <Button 
          onClick={handleGoHome}
          variant="outline"
          className="border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium px-8 py-2.5 rounded-xl w-full sm:w-auto"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Feedback;