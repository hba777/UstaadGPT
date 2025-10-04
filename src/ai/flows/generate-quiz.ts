'use server';
/**
 * @fileOverview Generates a quiz from a document using AI.
 *
 * - generateQuiz - A function that handles the quiz generation process.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  documentText: z.string().describe('The text content of the document to generate a quiz from.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The desired difficulty of the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
    questionText: z.string().describe('The text of the quiz question.'),
    options: z.array(z.string()).describe('An array of possible answers for the question.'),
    correctAnswerIndex: z.number().describe('The 0-based index of the correct answer in the options array.')
});

const GenerateQuizOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('An array of quiz questions generated from the document content.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert in creating quizzes based on provided text content.

  Based on the following document text, generate a {{{difficulty | "medium"}}} difficulty quiz with multiple-choice questions.
  - "easy" questions should test basic recall and definitions.
  - "medium" questions should require some comprehension and application of concepts.
  - "hard" questions should require synthesis, analysis, or evaluation of the material.
  
  Each question should have a question text, an array of options, and the index of the correct answer.
  Return the output in the specified JSON format.

  Document Text: {{{documentText}}}
  `,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
