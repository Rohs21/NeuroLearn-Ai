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

    useEffect(() => {
        const GetInterviewDetails = async () => {
            try {
                const resp = await fetch(`/api/interview?mockId=${params.interviewId}`);
                const data = await resp.json();
                if (data.success && data.result) {
                    const jsonMockResp = JSON.parse(data.result.jsonMockResp);
                    if (Array.isArray(jsonMockResp)) {
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
            }
        };
        GetInterviewDetails();
    }, [params.interviewId]);

    return (
        <div className='px-3 sm:px-4 py-4 sm:py-6'>
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
            <div className='flex flex-col sm:flex-row justify-center sm:justify-end gap-3 sm:gap-6 mt-6 sm:mt-8 px-2'>
                {activeQuestionIndex > 0 &&
                    <Button onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}>Previous Question</Button>}
                {activeQuestionIndex !== mockInterviewQuestion.length - 1 &&
                    <Button onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}>Next Question</Button>}
                {activeQuestionIndex === mockInterviewQuestion.length - 1 &&
                    <Link href={`/dashboard/interview/${interviewData?.mockId}/feedback`}>
                        <Button>End Interview</Button>
                    </Link>}
            </div>
        </div>
    )
}

export default StartInterview