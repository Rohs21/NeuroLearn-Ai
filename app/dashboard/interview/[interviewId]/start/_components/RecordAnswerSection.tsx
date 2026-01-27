"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import useSpeechToText from 'react-hook-speech-to-text';
import { Mic, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { chatSession } from '@/utils/GeminiAIModal'

// Interface for individual question structure
interface MockInterviewQuestion {
    question: string;
    answer: string;
}

// Interface for interview data structure
interface InterviewData {
    id: number;
    jsonMockResp: string;
    jobPosition: string;
    jobDesc: string;
    jobExperience: string;
    createdBy: string;
    createdAt: string | null;
    mockId: string;
}

// Interface for AI feedback response
interface FeedbackResponse {
    rating: string;
    feedback: string;
}

// Interface for speech-to-text result
interface SpeechResult {
    transcript: string;
}

// Interface for component props
interface RecordAnswerSectionProps {
    mockInterviewQuestion: MockInterviewQuestion[];
    activeQuestionIndex: number;
    interviewData: InterviewData;
}

function RecordAnswerSection({
    mockInterviewQuestion,
    activeQuestionIndex,
    interviewData
}: RecordAnswerSectionProps): JSX.Element {
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
    
    const {
        error,
        interimResult,
        isRecording,
        results,
        startSpeechToText,
        stopSpeechToText,
        setResults
    } = useSpeechToText({
        continuous: true,
        useLegacyResults: false
    });

    useEffect(() => {
        (results as SpeechResult[] | undefined)?.forEach((result) => {
            setUserAnswer(prevAns => prevAns + ' ' + result.transcript);
        });
    }, [results]);

    // Reset answer submitted state when question changes
    useEffect(() => {
        setUserAnswer('');
        setAnswerSubmitted(false);
        setResults([]);
    }, [activeQuestionIndex, setResults]);

    const StartStopRecording = async (): Promise<void> => {
        if (isRecording) {
            stopSpeechToText();
        } else {
            setUserAnswer('');
            setAnswerSubmitted(false);
            startSpeechToText();
        }
    };

    const handleSubmitAnswer = async (): Promise<void> => {
        if (userAnswer.trim().length < 10) {
            toast('Please provide a longer answer (at least 10 characters)');
            return;
        }
        await UpdateUserAnswer();
    };

    const UpdateUserAnswer = async (): Promise<void> => {
        console.log(userAnswer);
        setLoading(true);
        
        try {
            const feedbackPrompt: string = "Question:" + mockInterviewQuestion[activeQuestionIndex]?.question +
                ", User Answer:" + userAnswer + ",Depends on question and user answer for give interview question " +
                " please give us rating for answer and feedback as area of improvmenet if any " +
                "in just 3 to 5 lines to improve it in JSON format with rating field and feedback field";

            const result = await chatSession.sendMessage(feedbackPrompt);
            let mockJsonResp: string = result.response.text();
            // Remove all code block markers (```json, ```, etc.)
            mockJsonResp = mockJsonResp.replace(/```json|```/gi, '').trim();
            const JsonFeedbackResp: FeedbackResponse = JSON.parse(mockJsonResp);
            
            const resp = await fetch('/api/interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    mockIdRef: interviewData?.mockId,
                    question: mockInterviewQuestion[activeQuestionIndex]?.question,
                    correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
                    userAns: userAnswer,
                    feedback: JsonFeedbackResp?.feedback,
                    rating: JsonFeedbackResp?.rating,
                    userEmail: '',
                })
            });
            const data = await resp.json();
            if (data.success) {
                toast('User Answer recorded successfully');
                setUserAnswer('');
                setResults([]);
                setAnswerSubmitted(true);
            } else {
                throw new Error(data.error || 'Failed to record answer');
            }
        } catch (error) {
            console.error('Error updating user answer:', error);
            toast('Error recording answer. Please try again.');
        } finally {
            setResults([]);
            setLoading(false);
        }
    };

    return (
        <div className='flex items-center justify-center flex-col px-2 sm:px-0'>
            <div className='flex flex-col mt-10 sm:mt-20 justify-center items-center bg-black rounded-lg p-3 sm:p-5 w-full max-w-[500px]'>
                <Image 
                    src={'/webcam.png'} 
                    width={150} 
                    height={150} 
                    alt="webcam img"
                    className='absolute w-[120px] h-[120px] sm:w-[200px] sm:h-[200px]'
                />
                <Webcam
                    mirrored={true}
                    className='w-full max-w-[500px]'
                    style={{
                        height: 'auto',
                        aspectRatio: '1/1',
                        zIndex: 10,
                    }}
                />
            </div>

            {/* Display current answer */}
            {userAnswer && (
                <div className='p-3 sm:p-4 my-4 border rounded-lg bg-gray-50 dark:bg-gray-900 w-full max-w-md'>
                    <h3 className='text-xs sm:text-sm font-medium text-gray-500 mb-2'>Your Answer:</h3>
                    <p className='text-xs sm:text-sm text-gray-700 dark:text-gray-300'>{userAnswer.trim()}</p>
                </div>
            )}

            {/* Answer submitted indicator */}
            {answerSubmitted && (
                <div className='p-3 my-2 border rounded-lg bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 w-full max-w-md text-center'>
                    ✓ Answer submitted for this question
                </div>
            )}

            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 my-6 sm:my-10 w-full sm:w-auto px-2 sm:px-0'>
                <Button 
                    disabled={loading}
                    variant="outline" 
                    onClick={StartStopRecording}
                    className='w-full sm:w-auto'
                >
                    {isRecording ? (
                        <span className='text-red-600 animate-pulse flex gap-2 items-center'>
                            <StopCircle />Stop Recording
                        </span>
                    ) : (
                        <span className='text-primary flex gap-2 items-center'>
                            <Mic />Record Answer
                        </span>
                    )}
                </Button>

                {userAnswer.trim().length > 0 && !isRecording && (
                    <Button 
                        disabled={loading || answerSubmitted}
                        onClick={handleSubmitAnswer}
                    >
                        {loading ? 'Submitting...' : 'Submit Answer'}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default RecordAnswerSection;
