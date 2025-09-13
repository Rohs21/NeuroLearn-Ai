import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
  ChatSession,
  GenerationConfig,
  SafetySetting
} from "@google/generative-ai";

const apiKey: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(apiKey);

const model: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig: GenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const safetySettings: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export const chatSession: ChatSession = model.startChat({
  generationConfig,
  safetySettings,
});
