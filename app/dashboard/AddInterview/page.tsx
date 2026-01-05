"use client"
import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { chatSession } from '@/utils/GeminiAIModal'
import { LoaderCircle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import { useRouter } from 'next/navigation'

interface MockInterviewResponse {
    mockId: string;
}

function AddNewInterview(): JSX.Element {
    const [openDailog, setOpenDailog] = useState<boolean>(false)
    const [jobPosition, setJobPosition] = useState<string>('')
    const [jobDesc, setJobDesc] = useState<string>('')
    const [jobExperience, setJobExperience] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [jsonResponse, setJsonResponse] = useState<string>('')
    
    const router = useRouter()

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        setLoading(true)
        e.preventDefault()
        console.log(jobPosition, jobDesc, jobExperience)

        const InputPrompt: string = "Job position: " + jobPosition + ", Job Description: " + jobDesc + ", Years of Experience : " + jobExperience + " , Depends on Job Position, Job Description & Years of Experience give us " + process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT + " Interview question along with Answer in JSON format, Give us question and answer field on JSON"

        let result: any
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                result = await chatSession.sendMessage(InputPrompt)
                break // Success, exit loop
            } catch (error: any) {
                if (error.message.includes("503") && attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1))) // Wait 2s, 4s, etc.
                    continue // Retry
                } else {
                    throw error // Re-throw if not 503 or max attempts reached
                }
            }
        }

        let MockJsonResp: string = result.response.text();
        // Remove code block markers (```json, ```, etc.)
        MockJsonResp = MockJsonResp.replace(/```json|```/gi, '').trim();
        // Optionally, extract the first JSON array/object if needed
        // const match = MockJsonResp.match(/[\[{].*[\]}]/s);
        // if (match) MockJsonResp = match[0];
        try {
            console.log(JSON.parse(MockJsonResp));
        } catch (e) {
            console.error('JSON parse error:', e, MockJsonResp);
        }
        setJsonResponse(MockJsonResp);

        if (MockJsonResp) {
            try {
                const mockId = uuidv4();
                const resp = await fetch('/api/interview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mockId: mockId,
                        jsonMockResp: MockJsonResp,
                        jobPosition: jobPosition,
                        jobDesc: jobDesc,
                        jobExperience: jobExperience,
                        createdBy: "anonymous",
                        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
                    })
                });
                const data = await resp.json();
                if (data.success && data.data) {
                    console.log("Inserted ID:", data.data);
                    setOpenDailog(false);
                    router.push('/dashboard/interview/' + mockId);
                } else {
                    throw new Error(data.error || 'DB Insert Error');
                }
            } catch (err) {
                console.log("DB Insert Error", err);
            }
        } else {
            console.log("ERROR");
        }
        setLoading(false);
    }

    return (
        <div className='px-3 sm:px-4 py-4 sm:py-6'>
            <div 
                className='p-6 sm:p-10 border rounded-lg bg-secondary hover:scale-105 hover:shadow-md cursor-pointer transition-all border-dashed'
                onClick={() => setOpenDailog(true)}
            >
                <h2 className='text-base sm:text-lg text-center'>+ Add New</h2>
            </div>
            <Dialog open={openDailog}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-2 sm:mx-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl">Tell us more about your job interviwing</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            Add details about your job position/role, job description, and years of experience.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onSubmit}>
                        <div>
                            <h2 className="text-sm sm:text-base">Add Details about yout job position/role, Job description and years of experience</h2>

                            <div className='mt-5 sm:mt-7 my-3'>
                                <label className="text-sm sm:text-base">Job Role/Job Position</label>
                                <Input 
                                    placeholder="Ex. Full Stack Developer" 
                                    required
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setJobPosition(event.target.value)}
                                />
                            </div>
                            <div className=' my-3'>
                                <label className="text-sm sm:text-base">Job Description/ Tech Stack (In Short)</label>
                                <Textarea 
                                    placeholder="Ex. React, Angular, NodeJs, MySql etc"
                                    required
                                    className="text-sm sm:text-base"
                                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setJobDesc(event.target.value)} 
                                />
                            </div>
                            <div className=' my-3'>
                                <label className="text-sm sm:text-base">Years of experience</label>
                                <Input 
                                    placeholder="Ex.5" 
                                    type="number" 
                                    max="100"
                                    required
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setJobExperience(event.target.value)}
                                />
                            </div>
                        </div>
                        <div className='flex flex-col sm:flex-row gap-3 sm:gap-5 justify-end mt-4'>
                            <Button type="button" variant="ghost" onClick={() => setOpenDailog(false)} className="w-full sm:w-auto">Cancel</Button>
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                {loading ?
                                    <>
                                        <LoaderCircle className='animate-spin mr-2' /> Generating from AI
                                    </> : 'Start Interview'
                                }
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddNewInterview
