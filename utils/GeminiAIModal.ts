// Replaced Gemini with server-side Groq routes to keep API key off the client.
// chatSession.sendMessage is kept for backwards compatibility with existing call sites.

export const chatSession = {
  sendMessage: async (prompt: string) => {
    // Extract feedback call vs question generation from prompt shape
    const isFeedback = prompt.startsWith('Question:') && prompt.includes('User Answer:');

    if (isFeedback) {
      const questionMatch = prompt.match(/^Question:(.*?),\s*User Answer:/s);
      const answerMatch = prompt.match(/User Answer:(.*?),Depends on/s);
      const question = questionMatch?.[1]?.trim() ?? '';
      const userAnswer = answerMatch?.[1]?.trim() ?? '';

      const res = await fetch('/api/interview/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, userAnswer }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to get feedback');

      return {
        response: {
          text: () => JSON.stringify({ rating: data.rating, feedback: data.feedback }),
        },
      };
    }

    // Interview question generation
    const posMatch = prompt.match(/Job position: (.*?), Job Description:/);
    const descMatch = prompt.match(/Job Description: (.*?), Years of Experience:/);
    const expMatch = prompt.match(/Years of Experience: (.*?)\./);
    const countMatch = prompt.match(/generate exactly (\d+) technical/);

    const res = await fetch('/api/interview/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobPosition: posMatch?.[1]?.trim() ?? '',
        jobDesc: descMatch?.[1]?.trim() ?? '',
        jobExperience: expMatch?.[1]?.trim() ?? '',
        questionCount: countMatch ? Number(countMatch[1]) : 10,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to generate questions');

    return {
      response: {
        text: () => data.rawJson,
      },
    };
  },
};
