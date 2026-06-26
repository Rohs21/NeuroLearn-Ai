import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) throw new Error('No Gemini API key found. Set GEMINI_API_KEY in your environment.');
    this.genAI = new GoogleGenerativeAI(key);
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

      // Extract the first JSON array from the response (works for single-line or compact JSON)
      let match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e) {
          console.error('[Gemini DEBUG] JSON parse error:', e);
        }
      }
      // Fallback if JSON parsing fails
      return [
        {
          question: "What is the main topic of this video?",
          options: ["Concept A", "Concept B", "Concept C", "All of the above"],
          correctAnswer: 3,
          explanation: "This video covers multiple related concepts."
        }
      ];
    } catch (error: any) {
      if (error && error.status === 404) {
        console.error('[Gemini ERROR] Model not found. Please check the model name and your API access.');
      }
      console.error('Gemini Quiz Generation Error:', error);
      return [];
    }
  }
  async enhanceJobKeywords(jobTitle: string, jobDescription: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `
      You are an AI career and learning assistant. Your task is to analyze a job description and provide a structured learning plan.

      Analyze the following job title and description and return a JSON object with three properties:
      1. "title": A concise, curated job title (e.g., "Full Stack Developer").
      2. "summary": A brief, one-sentence summary of the core technical requirements for this role.
      3. "keywords": An array of the top 10 most critical technologies and concepts from the description.

      Do not include any conversational text, explanations, or code formatting. The entire response must be a valid JSON object.

      Job Title: ${jobTitle}
      Job Description:
      ${jobDescription}
    `;

      const result = await model.generateContent(prompt);
      let jsonString = result.response.text().trim();

      // 🧹 Clean response (remove markdown code fences if Gemini adds them)
      jsonString = jsonString.replace(/```json|```/g, "").trim();

      console.log("[Gemini DEBUG] Cleaned JSON:", jsonString);

      const enhancedData = JSON.parse(jsonString);
      return enhancedData;
    } catch (error) {
      console.error("Error enhancing job keywords with Gemini:", error);
      return {
        title: jobTitle,
        summary: "Failed to generate AI-enhanced data.",
        keywords: [],
      };
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

  async generateLearningRoadmap(input: {
    topic: string;
    language: string;
    difficulty: string;
    contextVideos: { title: string; description: string }[];
    references: { title: string; url: string; note: string }[];
    coverageTopics?: string[];
    coverageInstructions?: string;
  }) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const context = input.contextVideos
      .slice(0, 8)
      .map((v, i) => `${i + 1}. ${v.title}\n   ${v.description.slice(0, 160)}`)
      .join('\n');

    const refs = input.references
      .map((r, i) => `${i + 1}. ${r.title} - ${r.url} (${r.note})`)
      .join('\n');

    const prompt = `You are a senior curriculum designer and technical educator.
Create a deeply practical, instructor-quality learning document for the topic below.

Topic: ${input.topic}
Language: ${input.language}
Difficulty: ${input.difficulty}

Requirements:
- documentMarkdown: polished study guide with executive summary and table of contents.
- outline: 6-10 top-level branches, each with 2-4 nested children where helpful.
- Every branch/child must have: summary, whyItMatters, prerequisites, keyTakeaways, commonMistakes, deepDiveMarkdown (200+ words), codeExample (if applicable), resources.
- Include runnable code snippets and at least one mini-project per major branch.

Video context:
${context || 'No video context provided.'}

Available references:
${refs || 'No references provided.'}

Coverage focus:
${input.coverageInstructions || 'Cover the essential hot topics for this subject comprehensively.'}

Return ONLY valid JSON — no text outside the JSON:
{
  "title": "...",
  "summary": "...",
  "level": "...",
  "estimatedTime": "...",
  "documentMarkdown": "# ...",
  "outline": [
    {
      "title": "...",
      "summary": "...",
      "whyItMatters": "...",
      "prerequisites": ["..."],
      "keyTakeaways": ["..."],
      "commonMistakes": ["..."],
      "deepDiveMarkdown": "### ...",
      "codeExample": "...",
      "resources": [{ "title": "...", "url": "..." }],
      "children": []
    }
  ],
  "nextSteps": ["..."],
  "references": [{ "title": "...", "url": "...", "note": "..." }],
  "coverageTopics": ["..."]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Strip possible markdown code fences
    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini returned no roadmap JSON');

    const parsed = JSON.parse(match[0]);
    return {
      title: parsed.title ?? `${input.topic} Learning Roadmap`,
      summary: parsed.summary ?? `A structured roadmap for ${input.topic}.`,
      level: parsed.level ?? input.difficulty,
      estimatedTime: parsed.estimatedTime ?? '4-8 weeks',
      documentMarkdown: parsed.documentMarkdown ?? `# ${input.topic}\n\nStudy roadmap unavailable.`,
      outline: Array.isArray(parsed.outline) ? parsed.outline : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      references: Array.isArray(parsed.references) ? parsed.references : input.references,
      coverageTopics: Array.isArray(parsed.coverageTopics) ? parsed.coverageTopics : input.coverageTopics,
    };
  }
}


