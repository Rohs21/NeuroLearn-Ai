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
                console.log("📍 Interview page loaded, fetching details for:", params.interviewId);
                const resp = await fetch(`/api/interview?mockId=${params.interviewId}`);
                const data = await resp.json();
                console.log("📍 Interview response received:", data);
                
                if (data.success && data.result) {
                    console.log("✅ Interview data loaded successfully");
                    console.log("📍 jsonMockResp preview:", data.result.jsonMockResp?.substring(0, 100));
                    setInterviewData(data.result as InterviewData);
                } else {
                    console.error("❌ Interview fetch failed:", data.error);
                    setInterviewData(null);
                }
            } catch (error) {
                console.error('❌ Error fetching interview details:', error);
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

    const handleEnableCamera = async (): Promise<void> => {
        try {
            // Attempt to request both camera and microphone upfront
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            stream.getTracks().forEach(track => track.stop());
        } catch (error: any) {
            console.warn("Could not pre-request media devices. Proceeding to component level:", error);
            // We do not block the user here. If they lack a device, the specific components will handle it.
        }
        
        setWebCamEnabled(true);
    };

    const handleUserMedia = (): void => {
        console.log("Webcam successfully initialized");
    };

    const handleUserMediaError = (error: string | DOMException): void => {
        console.error("Webcam initialization failed:", error);
        // We removed setWebCamEnabled(false) here. 
        // If a user doesn't have a camera or blocks it, we still want to let them proceed 
        // to the interview to answer questions using text/audio if possible.
    };

    if (isLoading) {
        return (
            <div className='my-20 flex justify-center'>
                <div className="flex flex-col items-center gap-4 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] p-10 shadow-sm">
                    <div className="w-8 h-8 border-2 border-zinc-200 dark:border-white/10 border-t-zinc-900 dark:border-t-white rounded-full animate-spin" />
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-lg font-semibold text-zinc-900 dark:text-white">Loading interview details...</div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">Please wait while we prepare your interview</div>
                    </div>
                </div>
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
            <div className='my-6 sm:my-10 max-w-6xl mx-auto px-4 sm:px-6'>
                <h2 className='font-semibold tracking-tight text-2xl sm:text-3xl mb-6 sm:mb-8 text-zinc-900 dark:text-white'>Let's Get Started</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10'>
                    {/* Interview Details Section */}
                    <div className='flex flex-col gap-4 sm:gap-6'>
                        <div className='flex flex-col p-6 sm:p-8 rounded-[2rem] border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-sm'>
                            <div className='space-y-4 sm:space-y-5'>
                                <div>
                                    <h3 className='text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider'>Job Position</h3>
                                    <p className='text-base sm:text-lg font-semibold text-zinc-900 dark:text-white'>{interviewData.jobPosition}</p>
                                </div>
                                
                                <div>
                                    <h3 className='text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider'>Job Description/Tech Stack</h3>
                                    <p className='text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed'>{interviewData.jobDesc}</p>
                                </div>
                                
                                <div>
                                    <h3 className='text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider'>Years of Experience</h3>
                                    <p className='text-base sm:text-lg font-semibold text-zinc-900 dark:text-white'>{interviewData.jobExperience} years</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className='p-5 sm:p-6 border rounded-2xl border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/30'>
                            <h2 className='flex gap-2 items-center text-zinc-900 dark:text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base'>
                                <Lightbulb className='h-4 w-4 sm:h-5 sm:w-5 text-zinc-500 dark:text-zinc-400' />
                                Information
                            </h2>
                            <p className='text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed'>
                                {process.env.NEXT_PUBLIC_INFORMATION}
                            </p>
                        </div>
                    </div>

                    {/* Webcam Section */}
                    <div className='flex flex-col justify-center'>
                        <div className='bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-sm h-full flex flex-col items-center justify-center'>
                            {webCamEnabled ? (
                                <div className='flex flex-col items-center'>
                                    <Webcam
                                        onUserMedia={handleUserMedia}
                                        onUserMediaError={handleUserMediaError}
                                        mirrored={true}
                                        className='rounded-lg border border-gray-300 w-full max-w-[400px]'
                                        style={{
                                            height: 'auto',
                                            aspectRatio: '4/3',
                                            maxHeight: 300
                                        }}
                                    />
                                    <p className='text-xs sm:text-sm text-gray-600 mt-3'>Camera is active and ready</p>
                                </div>
                            ) : (
                                <div className='flex flex-col items-center text-center w-full'>
                                    <div className='bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 mb-4 w-full'>
                                        <WebcamIcon className='h-16 w-16 sm:h-20 sm:w-20 mx-auto text-zinc-400 mb-4' />
                                        <h3 className='text-base sm:text-lg font-semibold text-zinc-900 dark:text-white mb-2'>Camera Setup Required</h3>
                                        <p className='text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mb-4'>
                                            Please enable your camera and microphone to proceed with the interview
                                        </p>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full font-medium border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                <div className='flex justify-center sm:justify-end items-end mt-8 sm:mt-12'>
                    <Button 
                        className='px-6 sm:px-8 py-2.5 font-medium cursor-pointer w-full sm:w-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity rounded-xl shadow-md'
                        disabled={isNavigating}
                        onClick={handleStartInterview}
                    >
                        Start Interview
                    </Button>
                </div>
            </div>

            {/* Loading Modal */}
            {isNavigating && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-lg p-6 sm:p-8 shadow-2xl border max-w-sm w-full mx-4">
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
