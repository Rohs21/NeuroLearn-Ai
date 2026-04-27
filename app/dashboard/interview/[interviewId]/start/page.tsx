"use client"
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic';
import QuestionsSection from './_components/QuestionsSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Dynamically import RecordAnswerSection with ssr: false
const RecordAnswerSection = dynamic(() => import('./_components/RecordAnswerSection'), {
  ssr: false, // Disable SSR for this component
});

interface InterviewData {
    id: number;
    mockId: string;
    jsonMockResp: string;
    jobPosition: string;
    jobDesc: string;
    jobExperience: string;
    createdBy: string;
    createdAt: string | null;
}

interface StartInterviewProps {
    params: { interviewId: string };
}

function StartInterview({ params }: StartInterviewProps) {
        const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
        const [mockInterviewQuestion, setMockInterviewQuestion] = useState<any[]>([]);
        const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
        const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const GetInterviewDetails = async () => {
            setIsLoading(true);
            try {
                console.log("Fetching interview details for:", params.interviewId);
                const resp = await fetch(`/api/interview?mockId=${params.interviewId}`);
                const data = await resp.json();
                console.log("Interview data received:", data);
                
                if (data.success && data.result) {
                    console.log("Interview found, parsing questions...");
                    console.log("jsonMockResp:", data.result.jsonMockResp);
                    
                    let jsonMockResp = data.result.jsonMockResp;
                    
                    // If it's a string, parse it
                    if (typeof jsonMockResp === 'string') {
                        // Clean up any remaining markdown code blocks
                        jsonMockResp = jsonMockResp
                            .replace(/```json\n?/gi, "")
                            .replace(/```\n?/gi, "")
                            .trim();
                        jsonMockResp = JSON.parse(jsonMockResp);
                    }
                    
                    if (Array.isArray(jsonMockResp)) {
                        console.log(`Successfully parsed ${jsonMockResp.length} questions`);
                        setMockInterviewQuestion(jsonMockResp);
                    } else {
                        console.error("jsonMockResp is not an array:", jsonMockResp);
                        setMockInterviewQuestion([]);
                    }
                    setInterviewData(data.result);
                } else {
                    console.error("No interview data found for mockId:", params.interviewId);
                    setMockInterviewQuestion([]);
                    setInterviewData(null);
                }
            } catch (error) {
                console.error('Error fetching interview details:', error);
                setMockInterviewQuestion([]);
                setInterviewData(null);
            } finally {
                setIsLoading(false);
            }
        };
        GetInterviewDetails();
    }, [params.interviewId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-zinc-500 font-medium">Loading interview questions...</p>
            </div>
        );
    }

    return (
        <div className='px-3 sm:px-4 py-4 sm:py-6'>
            {mockInterviewQuestion.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-red-500 font-semibold mb-2">No interview questions found</p>
                    <p className="text-muted-foreground text-sm">Please go back and create a new interview</p>
                </div>
            ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10'>
                {/* Questions */}
                <QuestionsSection
                    mockInterviewQuestion={mockInterviewQuestion}
                    activeQuestionIndex={activeQuestionIndex}
                />

                {/* Video/ Audio Recording */}
                                {interviewData && (
                                    <RecordAnswerSection
                                        mockInterviewQuestion={mockInterviewQuestion}
                                        activeQuestionIndex={activeQuestionIndex}
                                        interviewData={interviewData}
                                    />
                                )}
            </div>
            )}
            <div className='flex flex-col sm:flex-row justify-center sm:justify-end gap-3 sm:gap-4 mt-6 sm:mt-10 px-2'>
                {activeQuestionIndex > 0 &&
                    <Button 
                        variant="outline"
                        onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                        className="font-medium border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        Previous Question
                    </Button>}
                {activeQuestionIndex !== mockInterviewQuestion.length - 1 &&
                    <Button 
                        onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                        className="font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
                    >
                        Next Question
                    </Button>}
                {activeQuestionIndex === mockInterviewQuestion.length - 1 &&
                    <Link href={`/dashboard/interview/${interviewData?.mockId}/feedback`}>
                        <Button className="w-full sm:w-auto font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90">
                            End Interview
                        </Button>
                    </Link>}
            </div>
        </div>
    )
}

export default StartInterview