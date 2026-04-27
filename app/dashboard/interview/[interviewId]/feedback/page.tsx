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
  const router = useRouter();
  const interviewId: string = params.interviewId;

  useEffect(() => {
    const GetFeedback = async (): Promise<void> => {
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
      }
    };
    GetFeedback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const handleGoHome = (): void => {
    router.replace("/dashboard");
  };

  return (
    <div className="p-4 sm:p-10">
      {feedbackList.length === 0 ? (
        <h2 className="font-bold text-lg sm:text-xl text-gray-500">
          No Interview Feedback Record Found
        </h2>
      ) : (
        <>
          <div className="mb-8 sm:mb-10 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Interview Complete</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base">
              Here is your detailed feedback report with AI ratings and improvement areas.
            </p>
          </div>
          {feedbackList.map((item, index) => (
            <Collapsible key={index} className="mt-4 sm:mt-7">
              <CollapsibleTrigger className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl flex justify-between my-2 text-left gap-4 sm:gap-6 w-full text-sm sm:text-base font-medium text-zinc-900 dark:text-white shadow-sm hover:border-zinc-300 dark:hover:border-white/20 transition-all">
                <span className="line-clamp-2 sm:line-clamp-none">{item.question}</span>
                <ChevronsUpDown className="h-5 w-5 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-3 mt-3">
                  <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30">
                    <h2 className="text-sm sm:text-base text-zinc-900 dark:text-white font-medium mb-1 uppercase tracking-wider text-xs">Rating</h2>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">{item.rating || 'Not rated'}</p>
                  </div>
                  
                  <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-white dark:bg-zinc-900">
                    <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Your Answer</h2>
                    <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">{item.userAns || 'No answer provided'}</p>
                  </div>
                  
                  <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                    <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Expected Answer</h2>
                    <p className="text-sm sm:text-base text-zinc-900 dark:text-white leading-relaxed">{item.correctAns || 'No correct answer available'}</p>
                  </div>
                  
                  <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                    <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">AI Feedback</h2>
                    <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed">{item.feedback || 'No feedback available'}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </>
      )}
      <div className="mt-8 sm:mt-12">
        <Button 
          onClick={handleGoHome}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 font-medium px-8 py-2.5 rounded-xl shadow-md"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Feedback;