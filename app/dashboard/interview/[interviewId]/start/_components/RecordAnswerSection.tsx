"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import useSpeechToText from 'react-hook-speech-to-text';
import { Mic, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { chatSession } from '@/utils/GeminiAIModal'
import moment from 'moment'

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
    
    const {
        error,
        interimResult,
        isRecording,
        results,
        startSpeechToText,
        stopSpeechToText,
        setResults
    } = useSpeechToText({
        continuous: false,
        useLegacyResults: false
    });

    useEffect(() => {
        (results as SpeechResult[] | undefined)?.forEach((result) => {
            setUserAnswer(prevAns => prevAns + result.transcript);
        });
    }, [results]);

    useEffect(() => {
        if (!isRecording && userAnswer?.length > 10) {
            UpdateUserAnswer();
        }
    }, [userAnswer]);

    const StartStopRecording = async (): Promise<void> => {
        if (isRecording) {
            stopSpeechToText();
        } else {
            startSpeechToText();
        }
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
                body: JSON.stringify({
                    mockIdRef: interviewData?.mockId,
                    question: mockInterviewQuestion[activeQuestionIndex]?.question,
                    correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
                    userAns: userAnswer,
                    feedback: JsonFeedbackResp?.feedback,
                    rating: JsonFeedbackResp?.rating,
                    userEmail: '',
                    createdAt: moment().toISOString(),
                })
            });
            const data = await resp.json();
            if (data.success) {
                toast('User Answer recorded successfully');
                setUserAnswer('');
                setResults([]);
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
        <div className='flex items-center justify-center flex-col'>
            <div className='flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5'>
                <Image 
                    src={'/webcam.png'} 
                    width={200} 
                    height={200} 
                    alt="webcam img"
                    className='absolute'
                />
                <Webcam
                    mirrored={true}
                    style={{
                        height: 500,
                        width: 500,
                        zIndex: 10,
                    }}
                />
            </div>
            <Button 
                disabled={loading}
                variant="outline" 
                className="my-10"
                onClick={StartStopRecording}
            >
                {isRecording ? (
                    <h2 className='text-red-600 animate-pulse flex gap-2 items-center'>
                        <StopCircle />Stop Recording
                    </h2>
                ) : (
                    <h2 className='text-primary flex gap-2 items-center'>
                        <Mic />Record Answer
                    </h2>
                )}
            </Button>
        </div>
    );
}

export default RecordAnswerSection;
