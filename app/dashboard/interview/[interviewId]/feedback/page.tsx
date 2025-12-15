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
    <div className="p-10">
      {feedbackList.length === 0 ? (
        <h2 className="font-bold text-xl text-gray-500">
          No Interview Feedback Record Found
        </h2>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-green-500">Congratulation!</h2>
          <h2 className="font-bold text-2xl">Here is your interview feedback</h2>
          <h2 className="text-sm text-gray-500">
            Find below interview question with correct answer, your answer, and feedback for improvement
          </h2>
          {feedbackList.map((item, index) => (
            <Collapsible key={index} className="mt-7">
              <CollapsibleTrigger className="p-2 bg-secondary rounded-lg flex justify-between my-2 text-left gap-7 w-full">
                {item.question} <ChevronsUpDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-2">
                  <h2 className="text-red-500 p-2 border rounded-lg">
                    <strong>Rating:</strong> {item.rating || 'Not rated'}
                  </h2>
                  <h2 className="p-2 border rounded-lg bg-red-50 text-sm text-red-900">
                    <strong>Your Answer: </strong>
                    {item.userAns || 'No answer provided'}
                  </h2>
                  <h2 className="p-2 border rounded-lg bg-green-50 text-sm text-green-900">
                    <strong>Correct Answer: </strong>
                    {item.correctAns || 'No correct answer available'}
                  </h2>
                  <h2 className="p-2 border rounded-lg bg-blue-50 text-sm text-primary">
                    <strong>Feedback: </strong>
                    {item.feedback || 'No feedback available'}
                  </h2>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </>
      )}
      <Button onClick={handleGoHome}>Go Home</Button>
    </div>
  );
};

export default Feedback;