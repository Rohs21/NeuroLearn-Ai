'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { chatSession } from '@/utils/GeminiAIModal';
import { LoaderCircle, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AddInterviewProps {
  onSuccess?: () => void;
  variant?: 'button' | 'card';
}

export function AddInterview({ onSuccess, variant = 'button' }: AddInterviewProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [jobPosition, setJobPosition] = useState<string>('');
  const [jobDesc, setJobDesc] = useState<string>('');
  const [jobExperience, setJobExperience] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [jsonResponse, setJsonResponse] = useState<string>('');

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    setLoading(true);
    e.preventDefault();
    
    try {
      console.log("Starting interview creation with:", {
        jobPosition,
        jobDesc,
        jobExperience,
      });

      const questionCount = process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT || "10";
      const InputPrompt: string =
        `Job position: ${jobPosition}, Job Description: ${jobDesc}, Years of Experience: ${jobExperience}. Based on this information, generate exactly ${questionCount} technical interview questions with detailed answers in JSON array format. Each object must have "question" and "answer" fields. Return ONLY the JSON array, no other text. Example format: [{"question": "What is...?", "answer": "..."}, {"question": "How do you...?", "answer": "..."}]`;

      console.log("Prompt being sent to Gemini:", InputPrompt);

      let result: any;
      let lastError: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log(`Attempt ${attempt + 1} to call Gemini API...`);
          result = await chatSession.sendMessage(InputPrompt);
          console.log("Gemini API response received successfully");
          break;
        } catch (error: any) {
          lastError = error;
          console.error(`Attempt ${attempt + 1} failed:`, error);
          if (error.message?.includes("503") && attempt < 2) {
            const waitTime = 2000 * (attempt + 1);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          } else if (attempt < 2) {
            // Retry on other errors too
            const waitTime = 1000 * (attempt + 1);
            console.log(`Retrying in ${waitTime}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          } else {
            throw error;
          }
        }
      }

      if (!result) {
        throw new Error(`Failed to get response from Gemini after 3 attempts: ${lastError?.message}`);
      }

      let MockJsonResp: string = result.response.text();
      console.log("Raw response from Gemini:", MockJsonResp);
      
      // More thorough cleanup
      MockJsonResp = MockJsonResp
        .replace(/```json\n?/gi, "")
        .replace(/```\n?/gi, "")
        .trim();
      
      console.log("After cleanup:", MockJsonResp);

      try {
        const parsed = JSON.parse(MockJsonResp);
        console.log("Successfully parsed JSON:", parsed);
        
        // Validate it's an array
        if (!Array.isArray(parsed)) {
          throw new Error("Response is not an array");
        }
        
        // Validate structure
        if (parsed.length === 0) {
          throw new Error("Response array is empty");
        }
        
        parsed.forEach((item: any, index: number) => {
          if (!item.question) {
            throw new Error(`Item ${index} missing 'question' field`);
          }
          if (!item.answer) {
            throw new Error(`Item ${index} missing 'answer' field`);
          }
        });
      } catch (e) {
        console.error("JSON parse/validation error:", e, "Raw response:", MockJsonResp);
        throw new Error(`Failed to parse interview questions: ${e instanceof Error ? e.message : String(e)}`);
      }
      setJsonResponse(MockJsonResp);

      if (MockJsonResp) {
        try {
          const mockId = uuidv4();
          console.log("Sending interview data to API:", { mockId, questionCount: MockJsonResp.split('"question"').length });
          
          const resp = await fetch("/api/interview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              mockId: mockId,
              jsonMockResp: MockJsonResp,
              jobPosition: jobPosition,
              jobDesc: jobDesc,
              jobExperience: jobExperience,
              createdBy: "anonymous",
              createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            }),
          });
          const data = await resp.json();
          console.log("API Response:", data);
          
          if (data.success && data.data) {
            console.log("Interview created successfully:", data.data);
            console.log("Redirecting to interview page with mockId:", mockId);
            toast.success("Interview created! Starting interview...");
            setOpenDialog(false);
            setJobPosition("");
            setJobDesc("");
            setJobExperience("");
            setJsonResponse("");
            if (onSuccess) {
              onSuccess();
            }
            // Small delay before redirect to ensure toast is visible
            const redirectPath = `/dashboard/interview/${mockId}`;
            console.log("Redirect path:", redirectPath);
            setTimeout(() => {
              console.log("⏳ Executing redirect to:", redirectPath);
              try {
                router.push(redirectPath);
                console.log("✅ Router push executed");
              } catch (pushError) {
                console.error("❌ Router push failed:", pushError);
              }
            }, 1000);
          } else {
            throw new Error(data.error || "Failed to create interview");
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Failed to create interview. Please try again.";
          console.error("Error creating interview:", err);
          toast.error(errorMsg);
        }
      } else {
        const errorMsg = "Failed to generate interview questions. Please try again.";
        console.error(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      console.error("Unexpected error in onSubmit:", error);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'card') {
    return (
      <>
        <div
          className="p-6 sm:p-10 border rounded-lg bg-secondary hover:scale-105 hover:shadow-md cursor-pointer transition-all border-dashed"
          onClick={() => setOpenDialog(true)}
        >
          <h2 className="text-base sm:text-lg text-center">+ Add New Interview</h2>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-2 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">Tell us more about your job interview</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Add details about your job position/role, job description, and years of experience.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit}>
              <div>
                <h2 className="text-sm sm:text-base">
                  Add Details about your job position/role, Job description and years of experience
                </h2>

                <div className="mt-5 sm:mt-7 my-3">
                  <label className="text-sm sm:text-base">Job Role/Job Position</label>
                  <Input
                    placeholder="Ex. Full Stack Developer"
                    required
                    value={jobPosition}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setJobPosition(event.target.value)
                    }
                  />
                </div>
                <div className="my-3">
                  <label className="text-sm sm:text-base">Job Description/ Tech Stack (In Short)</label>
                  <Textarea
                    placeholder="Ex. React, Angular, NodeJs, MySql etc"
                    required
                    className="text-sm sm:text-base"
                    value={jobDesc}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setJobDesc(event.target.value)
                    }
                  />
                </div>
                <div className="my-3">
                  <label className="text-sm sm:text-base">Years of experience</label>
                  <Input
                    placeholder="Ex.5"
                    type="number"
                    max="100"
                    required
                    value={jobExperience}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setJobExperience(event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-end mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenDialog(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <LoaderCircle className="animate-spin mr-2" /> Generating from AI
                    </>
                  ) : (
                    "Start Interview"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Button variant
  return (
    <>
      <Button onClick={() => setOpenDialog(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        New Interview
      </Button>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Tell us more about your job interview</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Add details about your job position/role, job description, and years of experience.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div>
              <h2 className="text-sm sm:text-base">
                Add Details about your job position/role, Job description and years of experience
              </h2>

              <div className="mt-5 sm:mt-7 my-3">
                <label className="text-sm sm:text-base">Job Role/Job Position</label>
                <Input
                  placeholder="Ex. Full Stack Developer"
                  required
                  value={jobPosition}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setJobPosition(event.target.value)
                  }
                />
              </div>
              <div className="my-3">
                <label className="text-sm sm:text-base">Job Description/ Tech Stack (In Short)</label>
                <Textarea
                  placeholder="Ex. React, Angular, NodeJs, MySql etc"
                  required
                  className="text-sm sm:text-base"
                  value={jobDesc}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setJobDesc(event.target.value)
                  }
                />
              </div>
              <div className="my-3">
                <label className="text-sm sm:text-base">Years of experience</label>
                <Input
                  placeholder="Ex.5"
                  type="number"
                  max="100"
                  required
                  value={jobExperience}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setJobExperience(event.target.value)
                  }
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-end mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenDialog(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <LoaderCircle className="animate-spin mr-2" /> Generating from AI
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
