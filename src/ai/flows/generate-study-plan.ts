'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a personalized study plan.
 *
 * - generateStudyPlan - A function that handles the study plan generation process.
 * - GenerateStudyPlanInput - The input type for the generateStudyPlan function.
 * - GenerateStudyPlanOutput - The return type for the generateStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateStudyPlanInputSchema = z.object({
  documentContent: z.string().describe('The content of the document to base the study plan on.'),
  userGoal: z.string().describe('The user\'s specific goal, including the topic and desired completion date. e.g., "learn about supervised learning by next friday"'),
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

const StudyDaySchema = z.object({
    day: z.number().describe('The day number in the study plan (e.g., 1, 2, 3).'),
    activities: z.array(z.string()).describe('A list of specific, actionable study activities for that day.'),
    topic: z.string().describe('The main topic or focus for the day.'),
});

export const GenerateStudyPlanOutputSchema = z.object({
  plan: z.array(StudyDaySchema).describe('An array of daily study plans.'),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

export async function generateStudyPlan(input: GenerateStudyPlanInput): Promise<GenerateStudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  input: {schema: GenerateStudyPlanInputSchema},
  output: {schema: GenerateStudyPlanOutputSchema},
  prompt: `You are an expert academic advisor. Your task is to create a structured, day-by-day study plan based on the provided document content and the user's goal.

Break down the document's topics into a logical sequence over several days. For each day, provide a main topic and a list of 2-3 concrete activities. These activities should leverage the features of the app, such as:
- "Read and Summarize section X of the document."
- "Generate and review flashcards for key terms in section Y."
- "Take a generated quiz on the topics of Z."
- "Use the AI Chatbot to ask clarifying questions about concept A."

User's Goal: {{{userGoal}}}

Document Content:
{{{documentContent}}}

Generate a realistic, step-by-step plan to help the user achieve their goal. Ensure the plan is returned in the specified JSON format.
`,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
