type GrokResponse = {
  choices?: { message?: { content?: string } }[];
};

export class GrokService {
  private apiKey: string | undefined;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.GROK_API_KEY;
    this.apiUrl = process.env.GROK_API_URL || 'https://api.grok.ai/v1/chat/completions';
    if (!this.apiKey) {
      console.warn('GrokService: GROK_API_KEY not set — Grok disabled');
    }
  }

  private async complete(prompt: string, maxTokens = 1024): Promise<string> {
    if (!this.apiKey) throw new Error('GROK_API_KEY not configured');

    const body = {
      model: 'grok-1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    };

    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Grok API error: ${res.status} ${text}`);
    }

    const json = (await res.json()) as GrokResponse;
    return json.choices?.[0]?.message?.content || '';
  }

  async generateVideoContent(title: string, description: string, transcript?: string) {
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

For "summary": Write in markdown using ## headings. Teach the concepts directly — explain HOW things work, WHAT they mean, WHY they matter. Do NOT say 'this video covers' or 'the instructor explains'. Write as if YOU are teaching the student. Use headings and at least 300 words.

For "quiz": exactly 7 multiple-choice questions testing understanding of the actual concepts. Mix easy/medium/hard. Each has 4 options and an explanation.

For "flashcards": exactly 5 cards. Front = concept or question. Back = clear explanation/answer.

Return ONLY valid JSON, nothing else.`;

    const text = await this.complete(prompt, 4096);
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0].replace(/\n/g, '\\n'));
        return {
          summary: parsed.summary ?? 'Summary unavailable.',
          quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
          flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
        };
      } catch (e) {
        console.error('Grok parse error:', e);
      }
    }

    return { summary: 'Summary unavailable.', quiz: [], flashcards: [] };
  }
}
