"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import useSpeechToText from 'react-hook-speech-to-text';
import { Mic, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { chatSession } from '@/utils/GeminiAIModal'
import { useSession } from 'next-auth/react'

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
    const { data: session } = useSession();
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
                    userEmail: session?.user?.email ?? '',
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
        <div className='flex flex-col items-center justify-center w-full h-full p-6 sm:p-8 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-sm my-4 sm:my-10'>
            <div className='flex flex-col justify-center items-center w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/50 relative'>
                {!isRecording && (
                    <Image 
                        src={'/webcam.png'} 
                        width={150} 
                        height={150} 
                        alt="webcam img"
                        className='absolute w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] opacity-20 pointer-events-none z-0'
                    />
                )}
                <Webcam
                    mirrored={true}
                    className='w-full h-full object-cover z-10'
                    style={{
                        height: '100%',
                        width: '100%'
                    }}
                />
            </div>

            {/* Display current answer */}
            {userAnswer && (
                <div className='p-4 sm:p-5 mt-6 border border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 w-full max-w-[500px]'>
                    <h3 className='text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white mb-2 tracking-wide uppercase'>Live Transcript:</h3>
                    <p className='text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed'>{userAnswer.trim()}</p>
                </div>
            )}

            {/* Answer submitted indicator */}
            {answerSubmitted && (
                <div className='p-3 sm:p-4 mt-6 border border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white w-full max-w-[500px] text-center font-medium text-sm'>
                    ✓ Answer successfully submitted
                </div>
            )}

            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 w-full max-w-[500px]'>
                <Button 
                    disabled={loading}
                    variant="outline" 
                    onClick={StartStopRecording}
                    className={`flex-1 font-medium transition-all ${isRecording ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50' : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                    {isRecording ? (
                        <span className='text-zinc-900 dark:text-white animate-pulse flex gap-2 items-center'>
                            <StopCircle className="h-4 w-4" /> Stop Recording
                        </span>
                    ) : (
                        <span className='text-zinc-900 dark:text-white flex gap-2 items-center'>
                            <Mic className="h-4 w-4" /> Record Answer
                        </span>
                    )}
                </Button>

                {userAnswer.trim().length > 0 && !isRecording && (
                    <Button 
                        disabled={loading || answerSubmitted}
                        onClick={handleSubmitAnswer}
                        className='flex-1 font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-sm'
                    >
                        {loading ? 'Submitting...' : 'Submit Answer'}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default RecordAnswerSection;
