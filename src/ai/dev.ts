import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-document.ts';
import '@/ai/flows/generate-quiz.ts';
import '@/ai/flows/generate-flashcards.ts';
import '@/ai/flows/answer-questions.ts';
import '@/ai/flows/generate-study-plan.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/orchestrator.ts';
