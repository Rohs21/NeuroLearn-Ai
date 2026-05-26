import Groq from 'groq-sdk';

const MODEL = 'llama-3.3-70b-versatile';

export type LearningRoadmapStep = {
  title: string;
  focus: string;
  searchQuery: string;
  rationale: string;
  keywords: string[];
};

export type LearningRoadmap = {
  topic: string;
  title: string;
  steps: LearningRoadmapStep[];
};

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

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return raw.slice(start, end + 1);
}

function buildFallbackRoadmap(topic: string, language = 'en', difficulty = 'beginner'): LearningRoadmap {
  const normalizedTopic = topic.trim();
  const languageSuffix = language && language !== 'en' ? ` in ${language}` : '';

  const steps: LearningRoadmapStep[] = [
    {
      title: `Orientation to ${normalizedTopic}`,
      focus: `Build the basic mental model for ${normalizedTopic} and understand the core vocabulary.`,
      searchQuery: `${normalizedTopic} introduction basics${languageSuffix}`,
      rationale: 'Start with the simplest explainer so the learner has context before moving deeper.',
      keywords: [normalizedTopic, 'introduction', 'basics'],
    },
    {
      title: `Core concepts of ${normalizedTopic}`,
      focus: `Learn the foundational ideas that show up in almost every practical use of ${normalizedTopic}.`,
      searchQuery: `${normalizedTopic} core concepts tutorial${languageSuffix}`,
      rationale: 'This step builds the real working vocabulary required to understand later lessons.',
      keywords: [normalizedTopic, 'core concepts', 'tutorial'],
    },
    {
      title: `Hands-on practice with ${normalizedTopic}`,
      focus: `See the concepts applied in a guided example or small project.`,
      searchQuery: `${normalizedTopic} practical tutorial project${languageSuffix}`,
      rationale: 'A practical lesson helps convert theory into usable skill.',
      keywords: [normalizedTopic, 'practical', 'project'],
    },
    {
      title: `Common workflows in ${normalizedTopic}`,
      focus: `Learn the typical patterns, tools, or workflows that people use in real work.`,
      searchQuery: `${normalizedTopic} workflow best practices${languageSuffix}`,
      rationale: 'The learner should now be ready for the patterns used in real projects.',
      keywords: [normalizedTopic, 'workflow', 'best practices'],
    },
    {
      title: `Advanced understanding of ${normalizedTopic}`,
      focus: `Explore deeper details, tradeoffs, and edge cases after the fundamentals are clear.`,
      searchQuery: `${normalizedTopic} advanced concepts${languageSuffix}`,
      rationale: 'Only after the foundations are stable should the playlist move to advanced material.',
      keywords: [normalizedTopic, 'advanced', 'tradeoffs'],
    },
  ];

  return {
    topic: normalizedTopic,
    title: `${normalizedTopic} Learning Roadmap`,
    steps: difficulty === 'advanced' ? steps.slice(1) : steps,
  };
}

const KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
].filter(Boolean) as string[];

export class GroqService {
  private async complete(prompt: string, maxTokens = 1024): Promise<string> {
    let lastError: any;
    for (const apiKey of KEYS) {
      try {
        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
        });
        return completion.choices[0]?.message?.content || '';
      } catch (err: any) {
        lastError = err;
        // Only fall through to next key on rate-limit / quota errors
        const status = err?.status ?? err?.error?.status;
        if (status === 429 || status === 402 || String(err?.message).includes('quota')) {
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async generateLearningRoadmap(
    topic: string,
    language = 'en',
    difficulty = 'beginner'
  ): Promise<LearningRoadmap> {
    try {
      const prompt = `You are creating an internal learning roadmap for a YouTube-based learning assistant.

Topic: ${topic}
Language: ${language}
Difficulty: ${difficulty}

Return ONLY valid JSON with this exact structure:
{
  "topic": "${topic}",
  "title": "...",
  "steps": [
    {
      "title": "...",
      "focus": "...",
      "searchQuery": "...",
      "rationale": "...",
      "keywords": ["...", "..."]
    }
  ]
}

Rules:
- Generate 5 to 7 steps.
- Order steps from beginner to advanced.
- Every step must be distinct and progressively build on the previous step.
- Make the searchQuery concrete enough for YouTube search.
- Do not repeat the same subtopic more than once.
- Keep titles short and instructional.
- Do not include markdown or any explanation outside the JSON.`;

      const text = await this.complete(prompt, 2048);
      const json = extractJsonObject(text);
      if (!json) {
        return buildFallbackRoadmap(topic, language, difficulty);
      }

      const parsed = JSON.parse(sanitizeJsonLiterals(json));
      const steps = Array.isArray(parsed.steps)
        ? parsed.steps
            .map((step: any) => ({
              title: String(step?.title || '').trim(),
              focus: String(step?.focus || '').trim(),
              searchQuery: String(step?.searchQuery || '').trim(),
              rationale: String(step?.rationale || '').trim(),
              keywords: Array.isArray(step?.keywords)
                ? step.keywords.map((keyword: any) => String(keyword).trim()).filter(Boolean)
                : [],
            }))
            .filter((step: LearningRoadmapStep) => step.title && step.focus && step.searchQuery)
        : [];

      if (steps.length < 3) {
        return buildFallbackRoadmap(topic, language, difficulty);
      }

      return {
        topic: String(parsed.topic || topic).trim() || topic.trim(),
        title: String(parsed.title || `${topic} Learning Roadmap`).trim(),
        steps,
      };
    } catch (error) {
      console.error('Groq generateLearningRoadmap error:', error);
      return buildFallbackRoadmap(topic, language, difficulty);
    }
  }

  async generateVideoContent(
    title: string,
    description: string,
    transcript?: string
  ): Promise<{ summary: string; quiz: any[]; flashcards: { front: string; back: string }[] }> {
    try {
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

  async enhanceJobKeywords(jobTitle: string, jobDescription: string) {
    try {
      const prompt = `You are an AI career and learning assistant. Your task is to analyze a job description and provide a structured learning plan.

Analyze the following job title and description and return a JSON object with three properties:
1. "title": A concise, curated job title (e.g., "Full Stack Developer").
2. "summary": A brief, one-sentence summary of the core technical requirements for this role.
3. "keywords": An array of the top 10 most critical technologies and concepts from the description.

Do not include any conversational text, explanations, or code formatting. The entire response must be a valid JSON object.

Job Title: ${jobTitle}
Job Description:
${jobDescription}`;

      const text = await this.complete(prompt, 1024);
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Groq enhanceJobKeywords error:', error);
      return {
        title: jobTitle,
        summary: 'Failed to generate AI-enhanced data.',
        keywords: [],
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
}
