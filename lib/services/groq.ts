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
    // ─── 1. Try Groq (both keys via this.complete) ───────────────────
    try {
      // Prefer Grok if configured
      if (process.env.GROK_API_KEY) {
        const grok = new GrokService();
        return await grok.generateVideoContent(title, description, transcript);
      }

      if (KEYS.length > 0) {
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
      }
    } catch (error) {
      console.warn('Groq generateVideoContent failed, trying Gemini fallback:', error);
    }

    // ─── 2. Gemini fallback (all Groq keys exhausted) ────────────────
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        console.log('[AI Fallback] Using Gemini for generateVideoContent...');
        const gem = new GeminiService();
        const [summary, quiz] = await Promise.all([
          gem.generateVideoSummary(title, description),
          gem.generateQuiz(title, description),
        ]);
        return { summary, quiz, flashcards: [] };
      } catch (gemErr) {
        console.error('[AI Fallback] Gemini generateVideoContent also failed:', gemErr);
      }
    }

    // ─── 3. Static fallback (last resort) ────────────────────────────
    return { summary: 'Summary unavailable. Please watch the video for full content.', quiz: [], flashcards: [] };
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
    const prompt = `You are an AI career and learning assistant. Your task is to analyze a job description and provide a structured learning plan.

Analyze the following job title and description and return a JSON object with three properties:
1. "title": A concise, curated job title (e.g., "Full Stack Developer").
2. "summary": A brief, one-sentence summary of the core technical requirements for this role.
3. "keywords": An array of the top 10 most critical technologies and concepts from the description.

Do not include any conversational text, explanations, or code formatting. The entire response must be a valid JSON object.

Job Title: ${jobTitle}
Job Description:
${jobDescription}`;

    // ─── 1. Try Groq ──────────────────────────────────────────────────
    try {
      const text = await this.complete(prompt, 1024);
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('Groq enhanceJobKeywords failed, trying Gemini fallback:', error);
    }

    // ─── 2. Gemini fallback ───────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        console.log('[AI Fallback] Using Gemini for enhanceJobKeywords...');
        const gem = new GeminiService();
        return await gem.enhanceJobKeywords(jobTitle, jobDescription);
      } catch (gemErr) {
        console.error('[AI Fallback] Gemini enhanceJobKeywords also failed:', gemErr);
      }
    }

    // ─── 3. Static fallback ───────────────────────────────────────────
    return {
      title: jobTitle,
      summary: 'Failed to generate AI-enhanced data.',
      keywords: [],
    };
  }

  async categorizeDifficulty(title: string, description: string): Promise<string> {
    const prompt = `Categorize the difficulty level of this educational content:

Title: ${title}
Description: ${description}

Return only one word: "beginner", "intermediate", or "advanced"

Guidelines:
- beginner: Basic concepts, no prerequisites, introductory
- intermediate: Some background knowledge needed, building on basics
- advanced: Complex topics, assumes prior knowledge, specialized`;

    // ─── 1. Try Groq ──────────────────────────────────────────────────
    try {
      const difficulty = (await this.complete(prompt, 10)).toLowerCase().trim();
      if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
        return difficulty;
      }
    } catch (error) {
      console.warn('Groq categorizeDifficulty failed, trying Gemini fallback:', error);
    }

    // ─── 2. Gemini fallback ───────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        console.log('[AI Fallback] Using Gemini for categorizeDifficulty...');
        const gem = new GeminiService();
        return await gem.categorizeDifficulty(title, description);
      } catch (gemErr) {
        console.error('[AI Fallback] Gemini categorizeDifficulty also failed:', gemErr);
      }
    }

    // ─── 3. Static fallback ───────────────────────────────────────────
    return 'beginner';
  }

  async categorizeDifficultyBatch(
    videos: { title: string; description: string }[]
  ): Promise<string[]> {
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

    // ─── 1. Try Groq ──────────────────────────────────────────────────
    try {
      const text = await this.complete(prompt, 256);
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const result = JSON.parse(match[0]) as string[];
        return result.map(d =>
          ['beginner', 'intermediate', 'advanced'].includes(d.toLowerCase()) ? d.toLowerCase() : 'beginner'
        );
      }
    } catch (error) {
      console.warn('Groq categorizeDifficultyBatch failed, trying Gemini fallback:', error);
    }

    // ─── 2. Gemini fallback (per-video, sequential) ───────────────────
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        console.log('[AI Fallback] Using Gemini for categorizeDifficultyBatch...');
        const gem = new GeminiService();
        return await Promise.all(
          videos.map(v => gem.categorizeDifficulty(v.title, v.description))
        );
      } catch (gemErr) {
        console.error('[AI Fallback] Gemini categorizeDifficultyBatch also failed:', gemErr);
      }
    }

    // ─── 3. Static fallback ───────────────────────────────────────────
    return videos.map(() => 'beginner');
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
}
