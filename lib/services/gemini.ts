import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateVideoSummary(title: string, description: string): Promise<string> {
    try {
      // Use a safe fallback model name (update as needed per Google API docs)
      const modelName = 'models/gemini-2.0-flash';
      const model = this.genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        Create a concise, educational summary of this video based on its title and description:
        
        Title: ${title}
        Description: ${description}
        
        Provide a clear, structured summary that:
        1. Explains what the viewer will learn
        2. Highlights key concepts covered
        3. Mentions the target audience level
        4. Keeps it under 150 words
        
        Format as plain text with bullet points where appropriate.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('[Gemini DEBUG] Raw summary response:', text);
      return text;
    } catch (error: any) {
      if (error && error.status === 404) {
        console.error('[Gemini ERROR] Model not found. Please check the model name and your API access.');
      }
      console.error('Gemini API Error:', error);
      return 'Summary unavailable. Please watch the video for full content.';
    }
  }

  async generateQuiz(title: string, description: string): Promise<any[]> {
    try {
      // Use a safe fallback model name (update as needed per Google API docs)
      const modelName = 'models/gemini-2.0-flash';
      const model = this.genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        Based on this educational video, create 3 multiple-choice questions:
        
        Title: ${title}
        Description: ${description}
        
        Generate questions that:
        1. Test understanding of key concepts
        2. Are appropriate for the content level
        3. Have 4 answer options each
        4. Include explanations for correct answers
        
        Return as JSON array with this structure:
        [
          {
            "question": "Question text",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": 0,
            "explanation": "Why this is correct"
          }
        ]
        
        Return only valid JSON, no additional text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('[Gemini DEBUG] Raw quiz response:', text);
      
      try {
        return JSON.parse(text);
      } catch {
        // Fallback if JSON parsing fails
        return [
          {
            question: "What is the main topic of this video?",
            options: ["Concept A", "Concept B", "Concept C", "All of the above"],
            correctAnswer: 3,
            explanation: "This video covers multiple related concepts."
          }
        ];
      }
    } catch (error: any) {
      if (error && error.status === 404) {
        console.error('[Gemini ERROR] Model not found. Please check the model name and your API access.');
      }
      console.error('Gemini Quiz Generation Error:', error);
      return [];
    }
  }

  async categorizeDifficulty(title: string, description: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `
        Categorize the difficulty level of this educational content:
        
        Title: ${title}
        Description: ${description}
        
        Return only one word: "beginner", "intermediate", or "advanced"
        
        Guidelines:
        - beginner: Basic concepts, no prerequisites, introductory
        - intermediate: Some background knowledge needed, building on basics
        - advanced: Complex topics, assumes prior knowledge, specialized
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const difficulty = response.text().toLowerCase().trim();
      
      if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
        return difficulty;
      }
      return 'beginner'; // default fallback
    } catch (error) {
      console.error('Gemini Difficulty Categorization Error:', error);
      return 'beginner';
    }
  }
}