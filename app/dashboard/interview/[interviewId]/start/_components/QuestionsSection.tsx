import { Lightbulb, Volume2 } from 'lucide-react';
import React from 'react';

// Interface for individual question structure
interface MockInterviewQuestion {
    question: string;
    answer?: string; // Optional field if you have answers
}

// Interface for component props
interface QuestionsSectionProps {
    mockInterviewQuestion: MockInterviewQuestion[];
    activeQuestionIndex: number;
}

function QuestionsSection({ mockInterviewQuestion, activeQuestionIndex }: QuestionsSectionProps): JSX.Element | null {
    const textToSpeech = (text: string): void => {
        if ('speechSynthesis' in window) {
            const speech: SpeechSynthesisUtterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(speech);
        } else {
            alert('Sorry, your browser does not support text to speech');
        }
    };

    const handleVolumeClick = (): void => {
        const questionText: string = mockInterviewQuestion[activeQuestionIndex]?.question || '';
        textToSpeech(questionText);
    };

    // Early return with proper typing
    if (!mockInterviewQuestion || !Array.isArray(mockInterviewQuestion)) {
        return null;
    }

    return (
        <div className='p-3 sm:p-5 border rounded-lg my-4 sm:my-10'>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-5'>
                {mockInterviewQuestion.map((question: MockInterviewQuestion, index: number) => (
                    <h2
                        key={index}
                        className={`p-2 border rounded-full
                        text-xs md:text-sm text-center cursor-pointer
                        ${activeQuestionIndex === index ? 'bg-primary text-white' : ''}`}
                    >
                        Question #{index + 1}
                    </h2>
                ))}
            </div>
            <h2 className='my-4 sm:my-5 text-sm sm:text-md md:text-lg'>
                {mockInterviewQuestion[activeQuestionIndex]?.question || 'No question available'}
            </h2>
            <Volume2
                className='cursor-pointer h-5 w-5 sm:h-6 sm:w-6'
                onClick={handleVolumeClick}
            />
            
            <div className='border rounded-lg p-3 sm:p-5 bg-blue-100 mt-10 sm:mt-20'>
                <h2 className='flex gap-2 items-center text-primary text-sm sm:text-base'>
                    <Lightbulb className='h-4 w-4 sm:h-5 sm:w-5' />
                    <strong>Note:</strong>
                </h2>
                <h2 className='text-xs sm:text-sm text-primary my-2'>{process.env.NEXT_PUBLIC_QUESTION_NOTE}</h2>
            </div>
        </div>
    );
}

export default QuestionsSection;
