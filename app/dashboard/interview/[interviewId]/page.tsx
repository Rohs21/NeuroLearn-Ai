"use client"
import { Button } from '@/components/ui/button'
import { Lightbulb, WebcamIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'

// Interface for the interview data structure
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

// Interface for component props
interface InterviewProps {
    params: { interviewId: string };
}

function Interview({ params }: InterviewProps): JSX.Element {
    const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
    const [webCamEnabled, setWebCamEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isNavigating, setIsNavigating] = useState<boolean>(false);
    const router = useRouter();

    // Use params directly (Next.js provides as object)

    useEffect(() => {
        const GetInterviewDetails = async (): Promise<void> => {
            try {
                const resp = await fetch(`/api/interview?mockId=${params.interviewId}`);
                const data = await resp.json();
                if (data.success && data.result) {
                    setInterviewData(data.result as InterviewData);
                } else {
                    setInterviewData(null);
                }
            } catch (error) {
                console.error('Error fetching interview details:', error);
                setInterviewData(null);
            } finally {
                setIsLoading(false);
            }
        };
        GetInterviewDetails();
    }, [params.interviewId]);

    const handleStartInterview = (): void => {
        setIsNavigating(true);
        // Simulate navigation delay and then redirect
        setTimeout(() => {
            router.push(`/dashboard/interview/${params.interviewId}/start`);
        }, 100);
    };

    const handleEnableCamera = (): void => {
        setWebCamEnabled(true);
    };

    const handleUserMedia = (): void => {
        setWebCamEnabled(true);
    };

    const handleUserMediaError = (): void => {
        setWebCamEnabled(false);
    };

    if (isLoading) {
        return (
            <div className='my-10 flex justify-center'>
                <div className="animate-pulse">Loading interview details...</div>
            </div>
        );
    }

    if (!interviewData) {
        return (
            <div className='my-10 flex justify-center'>
                <div className="text-red-500">Interview not found</div>
            </div>
        );
    }

    return (
        <>
            <div className='my-10 max-w-6xl mx-auto px-4'>
                <h2 className='font-bold text-2xl mb-8'>Let's Get Started</h2>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                    {/* Interview Details Section */}
                    <div className='flex flex-col my-5 gap-5'>
                        <div className='flex flex-col p-6 rounded-lg border border-gray-200 gap-4 bg-white shadow-sm'>
                            <div className='space-y-4'>
                                <div>
                                    <h3 className='text-sm font-medium text-gray-500 mb-1'>Job Position</h3>
                                    <p className='text-lg font-semibold text-gray-900'>{interviewData.jobPosition}</p>
                                </div>
                                
                                <div>
                                    <h3 className='text-sm font-medium text-gray-500 mb-1'>Job Description/Tech Stack</h3>
                                    <p className='text-base text-gray-700 leading-relaxed'>{interviewData.jobDesc}</p>
                                </div>
                                
                                <div>
                                    <h3 className='text-sm font-medium text-gray-500 mb-1'>Years of Experience</h3>
                                    <p className='text-lg font-semibold text-gray-900'>{interviewData.jobExperience} years</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className='p-5 border rounded-lg border-yellow-200 bg-yellow-50'>
                            <h2 className='flex gap-2 items-center text-yellow-700 font-semibold mb-3'>
                                <Lightbulb className='h-5 w-5' />
                                Information
                            </h2>
                            <p className='text-yellow-700 text-sm leading-relaxed'>
                                {process.env.NEXT_PUBLIC_INFORMATION}
                            </p>
                        </div>
                    </div>

                    {/* Webcam Section */}
                    <div className='flex flex-col justify-center'>
                        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
                            {webCamEnabled ? (
                                <div className='flex flex-col items-center'>
                                    <Webcam
                                        onUserMedia={handleUserMedia}
                                        onUserMediaError={handleUserMediaError}
                                        mirrored={true}
                                        className='rounded-lg border border-gray-300'
                                        style={{
                                            height: 300,
                                            width: 400,
                                            maxWidth: '100%'
                                        }}
                                    />
                                    <p className='text-sm text-gray-600 mt-3'>Camera is active and ready</p>
                                </div>
                            ) : (
                                <div className='flex flex-col items-center text-center'>
                                    <div className='bg-gray-50 rounded-lg p-8 mb-4 w-full'>
                                        <WebcamIcon className='h-20 w-20 mx-auto text-gray-400 mb-4' />
                                        <h3 className='text-lg font-medium text-gray-900 mb-2'>Camera Setup Required</h3>
                                        <p className='text-gray-600 mb-4'>
                                            Please enable your camera and microphone to proceed with the interview
                                        </p>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full font-medium"
                                        onClick={handleEnableCamera}
                                        disabled={isNavigating}
                                    >
                                        Enable Camera and Microphone
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Start Interview Button */}
                <div className='flex justify-end items-end mt-10'>
                    <Button 
                        className='px-8 py-2 font-medium cursor-pointer'
                        disabled={!webCamEnabled || isNavigating}
                        onClick={handleStartInterview}
                    >
                        Start Interview
                    </Button>
                </div>
            </div>

            {/* Loading Modal */}
            {isNavigating && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 shadow-2xl border max-w-sm w-full mx-4">
                        <div className="flex flex-col items-center space-y-4">
                            {/* Loading Spinner */}
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-primary"></div>
                            </div>
                            
                            {/* Loading Text */}
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    Starting Interview...
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Please wait while we prepare everything
                                </p>
                            </div>
                            
                            {/* Loading Dots Animation */}
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Interview;
