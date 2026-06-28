import Groq from 'groq-sdk';
import { GeminiService } from './gemini';
import { GrokService } from './grok';

const MODEL = 'llama-3.3-70b-versatile';

// Escapes literal newlines/tabs/carriage-returns inside JSON string values.
// LLMs often embed raw markdown newlines in strings, making JSON.parse fail.
function sanitizeJsonLiterals(raw: string): string {
  let inString = false;
  let escaped = false;
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) { out += ch; escaped = false; continue; }
    if (ch === '\\' && inString) { out += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; out += ch; continue; }
    if (inString) {
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') { out += '\\r'; continue; }
      if (ch === '\t') { out += '\\t'; continue; }
    }
    out += ch;
  }
  return out;
}

const KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
].filter(Boolean) as string[];

export class GroqService {
  private async complete(prompt: string, maxTokens = 1024): Promise<string> {
    let lastError: any;
    const maxRetries = 2;
    const fallbackModel = 'llama-3.1-8b-instant';

    apiKeyLoop: for (const apiKey of KEYS) {
      // Try primary model first, then fallback model
      for (const modelToUse of [MODEL, fallbackModel]) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const groq = new Groq({ apiKey });
            const completion = await groq.chat.completions.create({
              model: modelToUse,
              messages: [{ role: 'user', content: prompt }],
              max_tokens: maxTokens,
            });
            return completion.choices[0]?.message?.content || '';
          } catch (err: any) {
            lastError = err;
            const status = err?.status ?? err?.error?.status;
            
            if (status === 429) {
              // If it's a rate limit error and we have retries left, wait and try again
              if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt + 1) * 1000;
                console.log(`Groq rate limit hit for ${modelToUse}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
            
            // If we hit a rate limit on the primary model, try the fallback model in the same key
            if (status === 429 && modelToUse === MODEL) {
              console.log(`Rate limit reached for ${MODEL}, falling back to ${fallbackModel}`);
              break; // Break the attempt loop to try the next model
            }

            // Only fall through to next key on rate-limit / quota errors
            if (status === 429 || status === 402 || String(err?.message).includes('quota')) {
              continue apiKeyLoop; // Move to the next API key
            }
            throw err;
          }
        }
      }
    }
    throw lastError;
  }

  async generateVideoContent(
    title: string,
    description: string,
    transcript?: string
  ): Promise<{ summary: string; quiz: any[]; flashcards: { front: string; back: string }[] }> {
    try {
      // Prefer Grok if configured
      if (process.env.GROK_API_KEY) {
        const grok = new GrokService();
        return await grok.generateVideoContent(title, description, transcript);
      }

      // If no GROQ API keys are configured, fall back to Gemini (Google) if available.
      if (KEYS.length === 0 && process.env.GEMINI_API_KEY) {
        const gem = new GeminiService();
        const summary = await gem.generateVideoSummary(title, description);
        const quiz = await gem.generateQuiz(title, description);
        return { summary, quiz, flashcards: [] };
      }

      const content = transcript && transcript.length > 200
        ? `Transcript:\n${transcript.slice(0, 3000)}`
        : `Description:\n${description.slice(0, 800)}`;

      const prompt = `You are an expert educator. A student just watched this video. Your job is to teach them the actual concepts from it — not describe the video, but explain the content itself as a knowledgeable instructor would.

Title: ${title}
${content}

Return a single JSON object with exactly these three keys (no text outside the JSON):
{
  "summary": "...",
  "quiz": [...],
  "flashcards": [...]
}

For "summary": Write in markdown using ## headings. Teach the concepts directly — explain HOW things work, WHAT they mean, WHY they matter. Do NOT say 'this video covers' or 'the instructor explains'. Write as if YOU are teaching the student. Use:
## What You'll Learn
(1-2 sentences on the skill/knowledge gained)
## Core Concepts Explained
(Bullet list — each bullet explains a concept from the content in detail, e.g. '- **Variables**: A variable stores a value in memory. In Python you write x = 5...')
## Key Takeaways
(4-5 bullet points of the most important things to remember — stated as facts/rules, not as 'the video says')
## Prerequisites & Next Steps
(What you need to know before this, and what to learn after)
Min 300 words. Explain concepts substantively.

For "quiz": exactly 7 multiple-choice questions testing understanding of the actual concepts. Mix easy/medium/hard. Each has 4 options and an explanation.
[{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." }]

For "flashcards": exactly 5 cards. Front = concept or question. Back = clear explanation/answer.
[{ "front": "...", "back": "..." }]

Return ONLY valid JSON, nothing else.`;

      const text = await this.complete(prompt, 4096);

      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(sanitizeJsonLiterals(match[0]));
        return {
          summary: parsed.summary ?? 'Summary unavailable.',
          quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
          flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
        };
      }
      return { summary: 'Summary unavailable.', quiz: [], flashcards: [] };
    } catch (error) {
      console.error('Groq generateVideoContent error:', error);
      return { summary: 'Summary unavailable.', quiz: [], flashcards: [] };
    }
  }

  // kept for backwards compat — delegates to combined call
  async generateVideoSummary(title: string, description: string, transcript?: string): Promise<string> {
    const result = await this.generateVideoContent(title, description, transcript);
    return result.summary;
  }

  async generateQuiz(title: string, description: string, transcript?: string): Promise<any[]> {
    const result = await this.generateVideoContent(title, description, transcript);
    return result.quiz;
  }

  async generateFlashcards(title: string, description: string, transcript?: string): Promise<{ front: string; back: string }[]> {
    const result = await this.generateVideoContent(title, description, transcript);
    return result.flashcards;
  }

  async generateLearningRoadmap(input: {
    topic: string;
    language: string;
    difficulty: string;
    contextVideos: { title: string; description: string }[];
    references: { title: string; url: string; note: string }[];
    coverageTopics?: string[];
    coverageInstructions?: string;
  }): Promise<{
    title: string;
    summary: string;
    level: string;
    estimatedTime: string;
    documentMarkdown: string;
    outline: {
      title: string;
      summary: string;
      whyItMatters?: string;
      prerequisites?: string[];
      keyTakeaways?: string[];
      commonMistakes?: string[];
      deepDiveMarkdown?: string;
      codeExample?: string;
      resources?: { title: string; url: string }[];
      children?: any[];
    }[];
    nextSteps: string[];
    references: { title: string; url: string; note: string }[];
    coverageTopics?: string[];
  }> {
    try {
      const context = input.contextVideos
        .slice(0, 8)
        .map((video, index) => `${index + 1}. ${video.title}\n   ${video.description.slice(0, 160)}`)
        .join('\n');

      const refs = input.references
        .map((reference, index) => `${index + 1}. ${reference.title} - ${reference.url} (${reference.note})`)
        .join('\n');

      const prompt = `You are a senior curriculum designer and technical educator.
Create a deeply practical, instructor-quality learning document for the topic below. The goal is to produce content that a learner can follow step-by-step and use immediately — include conceptual explanations, worked examples, exercises, and concrete implementation notes.

Topic: ${input.topic}
Language: ${input.language}
Difficulty: ${input.difficulty}

Requirements:
- The top-level document (documentMarkdown) should be a polished study guide with an executive summary and a table of contents.
- The outline must be tree-structured. For each top-level branch (6–10 when broad) include 2–4 nested children where helpful.
- For every branch and child, provide these fields: summary, whyItMatters, prerequisites, keyTakeaways, commonMistakes, deepDiveMarkdown, codeExample (if applicable), and resources.
- deepDiveMarkdown must be substantive: at least 200–600 words per major branch (more for complex topics). Use headings, step-by-step instructions, diagrams (Mermaid allowed), annotated code blocks, and short exercises with suggested solutions.
- When the topic is technical, include runnable or copy-pasteable code snippets with brief annotations and expected outputs.
- Provide at least one practical mini-project or real-world exercise per major branch, with steps and a short rubric for evaluating success.
- If coverageTopics were supplied, address each explicitly. If not, infer canonical hot topics and ensure they appear as branches or nested children.

Video context:
${context || 'No video context provided.'}

Available references:
${refs || 'No references provided.'}

Coverage focus:
${input.coverageInstructions || 'Cover the essential hot topics for this subject comprehensively.'}

Return only valid JSON with this exact shape (deep fields required):
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
      "children": [ /* same shape as parent */ ]
    }
  ],
  "nextSteps": ["..."],
  "references": [ { "title": "...", "url": "...", "note": "..." } ],
  "coverageTopics": ["..."]
}

Guidelines:
- Favor clarity and practical guidance over brevity. When in doubt, expand explanations and add short examples.
- Ensure deepDiveMarkdown sections include specific, actionable steps a learner can follow (commands, code snippets, expected outputs, configuration notes).
- Use Mermaid diagrams for architecture or flow explanations when helpful.
- Avoid conversational filler; write as an expert instructor.
`;

      const text = await this.complete(prompt, 4096);
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error('No roadmap JSON returned');
      }

      const parsed = JSON.parse(sanitizeJsonLiterals(match[0]));

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
    } catch (error) {
      console.error('Groq generateLearningRoadmap error — trying Gemini fallback:', error);

      // ─── Gemini fallback ───────────────────────────────────────────
      if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        try {
          console.log('Falling back to Gemini for roadmap generation...');
          const gem = new GeminiService();
          return await gem.generateLearningRoadmap(input);
        } catch (gemErr) {
          console.error('Gemini generateLearningRoadmap fallback also failed:', gemErr);
        }
      }

      // ─── Static fallback (last resort) ────────────────────────────
      return {
        title: `${input.topic} Learning Roadmap`,
        summary: `A structured roadmap for ${input.topic}.`,
        level: input.difficulty,
        estimatedTime: '4-8 weeks',
        documentMarkdown: `# ${input.topic} Learning Roadmap\n\nA detailed roadmap could not be generated right now. Please try again in a moment.`,
        outline: [],
        nextSteps: ['Review the reference links and retry the roadmap generation.'],
        references: input.references,
        coverageTopics: input.coverageTopics,
      };
    }
  }

  async enhanceJobKeywords(jobTitle: string, jobDescription: string) {
    try {
      const prompt = `You are an AI career and learning assistant. Your task is to analyze a job description and categorize the required skills by difficulty level.

Analyze the following job title and description and return a JSON object with these properties:
1. "jobTitle": A concise, curated job title (e.g., "Full Stack Developer").
2. "beginner": An array of skills and concepts a beginner should learn first (foundational knowledge, basic tools, introductory concepts).
3. "intermediate": An array of skills for someone with some experience (mainstream frameworks, standard practices, mid-level concepts).
4. "advanced": An array of advanced/expert-level skills (specialized tools, architect-level concepts, cutting-edge technologies).

Each array should contain 3-7 skills as simple strings. Categorize thoughtfully based on typical learning curves.
Do not include any conversational text, explanations, or code formatting. The entire response must be a valid JSON object.

Job Title: ${jobTitle}
Job Description:
${jobDescription}`;

      const text = await this.complete(prompt, 1024);
      const cleaned = text.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        jobTitle: parsed.jobTitle || jobTitle,
        beginner: Array.isArray(parsed.beginner) ? parsed.beginner : [],
        intermediate: Array.isArray(parsed.intermediate) ? parsed.intermediate : [],
        advanced: Array.isArray(parsed.advanced) ? parsed.advanced : [],
      };
    } catch (error) {
      console.error('Groq enhanceJobKeywords error:', error);
      return {
        jobTitle,
        beginner: [],
        intermediate: [],
        advanced: [],
      };
    }
  }

  async categorizeDifficulty(title: string, description: string): Promise<string> {
    try {
      const prompt = `Categorize the difficulty level of this educational content:

Title: ${title}
Description: ${description}

Return only one word: "beginner", "intermediate", or "advanced"

Guidelines:
- beginner: Basic concepts, no prerequisites, introductory
- intermediate: Some background knowledge needed, building on basics
- advanced: Complex topics, assumes prior knowledge, specialized`;

      const difficulty = (await this.complete(prompt, 10)).toLowerCase().trim();
      if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
        return difficulty;
      }
      return 'beginner';
    } catch (error) {
      console.error('Groq categorizeDifficulty error:', error);
      return 'beginner';
    }
  }

  async categorizeDifficultyBatch(
    videos: { title: string; description: string }[]
  ): Promise<string[]> {
    try {
      const list = videos
        .map((v, i) => `${i + 1}. Title: ${v.title}\n   Description: ${v.description.slice(0, 120)}`)
        .join('\n');

      const prompt = `Categorize the difficulty level of each educational video below.
Return ONLY a JSON array of strings in the same order, each value being one of: "beginner", "intermediate", or "advanced".
No explanations, no extra text — just the JSON array.

Guidelines:
- beginner: Basic concepts, no prerequisites, introductory
- intermediate: Some background knowledge needed, building on basics
- advanced: Complex topics, assumes prior knowledge, specialized

Videos:
${list}`;

      const text = await this.complete(prompt, 256);
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const result = JSON.parse(match[0]) as string[];
        return result.map(d =>
          ['beginner', 'intermediate', 'advanced'].includes(d.toLowerCase()) ? d.toLowerCase() : 'beginner'
        );
      }
      return videos.map(() => 'beginner');
    } catch (error) {
      console.error('Groq categorizeDifficultyBatch error:', error);
      return videos.map(() => 'beginner');
    }
  }

  async generateInterviewQuestions(
    jobPosition: string,
    jobDesc: string,
    jobExperience: string,
    questionCount: number
  ): Promise<string> {
    const prompt = `Job position: ${jobPosition}, Job Description: ${jobDesc}, Years of Experience: ${jobExperience}. Based on this information, generate exactly ${questionCount} technical interview questions with detailed answers in JSON array format. Each object must have "question" and "answer" fields. Return ONLY the JSON array, no other text. Example format: [{"question": "What is...?", "answer": "..."}, {"question": "How do you...?", "answer": "..."}]`;

    const text = await this.complete(prompt, 4096);
    return text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
  }

  async generateAnswerFeedback(question: string, userAnswer: string): Promise<{ rating: string; feedback: string }> {
    const prompt = `Question: ${question}, User Answer: ${userAnswer}. Based on the question and user answer for this interview question, please give a rating for the answer and feedback as area of improvement if any in just 3 to 5 lines to improve it in JSON format with rating field and feedback field. Return only valid JSON.`;

    const text = await this.complete(prompt, 512);
    const cleaned = text.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleaned);
  }

  /**
   * Decomposes a learning topic into an ordered list of subtopics/modules
   * that map to distinct YouTube search queries, forming a structured curriculum.
   *
   * Returns an array like:
   * [
   *   { order: 1, topic: "React fundamentals and JSX",      searchQuery: "React JSX components tutorial beginner" },
   *   { order: 2, topic: "State management with useState",  searchQuery: "React useState hook tutorial" },
   *   ...
   * ]
   */
  async generateCurriculumTopics(input: {
    topic: string;
    difficulty: string;
    language: string;
    maxTopics?: number;
  }): Promise<{ order: number; topic: string; searchQuery: string }[]> {
    const max = input.maxTopics ?? 8;

    const prompt = `You are a curriculum designer building a structured video learning path.

A learner wants to study: "${input.topic}"
Their level: ${input.difficulty}
Preferred language: ${input.language}

Your task:
1. Break "${input.topic}" into ${max} distinct, ordered learning modules — from foundational to advanced.
2. For each module, write a focused YouTube search query that will find a high-quality tutorial video specifically for that module.
   - Keep each searchQuery under 60 characters.
   - Use terms like "tutorial", "explained", "crash course", "guide" to target educational videos.
   - Do NOT use "${input.topic}" alone as a query — always combine it with the specific subtopic.
   - If language is not English, append the language name (e.g., "in hindi") to each searchQuery.

Rules:
- Modules must be in strict learning order (prerequisites first).
- Each module must be a distinct concept — no overlapping.
- Beginner = start from absolute zero. Intermediate = skip basics. Advanced = assume strong foundation.
- Return ONLY a valid JSON array, no other text.

Format:
[
  { "order": 1, "topic": "Module name", "searchQuery": "specific youtube search query" },
  { "order": 2, "topic": "Module name", "searchQuery": "specific youtube search query" },
  ...
]`;

    // ─── 1. Try Groq ──────────────────────────────────────────────────
    try {
      const text = await this.complete(prompt, 1024);
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { order: number; topic: string; searchQuery: string }[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, max);
        }
      }
    } catch (error) {
      console.warn('[generateCurriculumTopics] Groq failed, falling back to Gemini:', error);
    }

    // ─── 2. Gemini fallback ───────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]) as { order: number; topic: string; searchQuery: string }[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, max);
          }
        }
      } catch (gemErr) {
        console.warn('[generateCurriculumTopics] Gemini also failed:', gemErr);
      }
    }

    // ─── 3. Static fallback — generic queries ────────────────────────
    console.warn('[generateCurriculumTopics] Both AI providers failed, using static fallback.');
    const langSuffix = input.language !== 'en' ? ` in ${input.language}` : '';
    return [
      { order: 1, topic: `${input.topic} introduction`,    searchQuery: `${input.topic} introduction tutorial${langSuffix}` },
      { order: 2, topic: `${input.topic} fundamentals`,    searchQuery: `${input.topic} fundamentals crash course${langSuffix}` },
      { order: 3, topic: `${input.topic} core concepts`,   searchQuery: `${input.topic} core concepts explained${langSuffix}` },
      { order: 4, topic: `${input.topic} practical guide`, searchQuery: `${input.topic} practical guide${langSuffix}` },
      { order: 5, topic: `${input.topic} advanced topics`, searchQuery: `${input.topic} advanced tutorial${langSuffix}` },
    ];
  }
}