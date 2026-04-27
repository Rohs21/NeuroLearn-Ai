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
        <div className='p-6 sm:p-8 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-sm my-4 sm:my-10 h-full flex flex-col'>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8'>
                {mockInterviewQuestion.map((question: MockInterviewQuestion, index: number) => (
                    <h2
                        key={index}
                        className={`py-2 px-3 border rounded-full
                        text-xs md:text-sm font-medium text-center cursor-pointer transition-colors
                        ${activeQuestionIndex === index 
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm' 
                            : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'}`}
                    >
                        Question #{index + 1}
                    </h2>
                ))}
            </div>
            
            <div className="flex-1 flex flex-col justify-center my-6">
                <h2 className='text-lg sm:text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white leading-relaxed tracking-tight mb-4'>
                    {mockInterviewQuestion[activeQuestionIndex]?.question || 'No question available'}
                </h2>
                <div 
                    onClick={handleVolumeClick}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 w-fit cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                >
                    <Volume2 className='h-4 w-4 sm:h-5 sm:w-5 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors' />
                    <span className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Listen to Question</span>
                </div>
            </div>
            
            <div className='border border-zinc-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 bg-zinc-50 dark:bg-zinc-800/30 mt-auto'>
                <h2 className='flex gap-2 items-center text-zinc-900 dark:text-white font-semibold text-sm sm:text-base mb-2'>
                    <Lightbulb className='h-4 w-4 sm:h-5 sm:w-5 text-zinc-500 dark:text-zinc-400' />
                    Note
                </h2>
                <p className='text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed'>
                    {process.env.NEXT_PUBLIC_QUESTION_NOTE}
                </p>
            </div>
        </div>
    );
}

export default QuestionsSection;
