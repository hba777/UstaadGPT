'use server';

/**
 * @fileOverview The main AI orchestrator agent for UstaadGPT.
 * This flow acts as the central "brain" of the application's proactive learning system.
 * It analyzes a user's complete learning history and determines the single most
 * impactful next action to recommend or perform.
 *
 * - runOrchestrator - The main function to trigger the orchestration logic.
 * - OrchestratorInput - The input schema, containing the user's full profile and learning data.
 * - OrchestratorOutput - The output schema, defining the specific task for a sub-agent to perform.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for a user's quiz attempt history
const QuizHistorySchema = z.object({
  bookTitle: z.string(),
  score: z.number(),
  attemptedAt: z.string(),
});

// Schema for the main orchestrator input
export const OrchestratorInputSchema = z.object({
  userProfile: z.object({
    displayName: z.string(),
    points: z.number(),
    loginStreak: z.number(),
    bio: z.string().optional(),
    badges: z.array(z.string()).optional(),
  }),
  books: z.array(
    z.object({
      title: z.string(),
      flashcards: z.array(z.object({ front: z.string(), back: z.string() })),
      savedQuizzes: z.array(
        z.object({
          name: z.string(),
          questions: z.array(z.object({ questionText: z.string() })),
        })
      ),
    })
  ),
  quizHistory: z.array(QuizHistorySchema),
});
export type OrchestratorInput = z.infer<typeof OrchestratorInputSchema>;

// Schema for the orchestrator's output, defining the next task
export const OrchestratorOutputSchema = z.object({
    agent: z.enum([
        'GENERATE_QUIZ',
        'GENERATE_FLASHCARDS',
        'REVIEW_STUDY_PLAN',
        'CHALLENGE_FRIEND',
        'SUMMARIZE_DOCUMENT',
        'IDLE' // Use IDLE if no specific action is critically needed right now.
    ]).describe("The specific sub-agent to task with the next action."),
    parameters: z.object({
        topic: z.string().optional().describe("The book title or subject for the task."),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe("The desired difficulty for a generated quiz."),
        reasoning: z.string().describe("A concise, user-facing explanation for why this action was chosen. e.g., 'You scored low on this topic recently.'"),
    }).describe("The parameters to pass to the selected sub-agent."),
});
export type OrchestratorOutput = z.infer<typeof OrchestratorOutputSchema>;

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorOutput> {
  return orchestratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'orchestratorPrompt',
  input: { schema: OrchestratorInputSchema },
  output: { schema: OrchestratorOutputSchema },
  prompt: `You are the Task Orchestrator Agent for UstaadGPT, an AI-powered study app.
Your role is to act as an expert, personalized tutor that analyzes a user's full learning history and determines the single most important and impactful next action for them.

Analyze the user's profile, their created books, and their recent quiz history to identify patterns, weaknesses, and opportunities for growth.

**Your Goal:** Based on your analysis, decide on ONE single task for a sub-agent to perform.

**Decision-Making Criteria:**
1.  **Address Weaknesses:** Prioritize topics where the user has consistently low quiz scores (e.g., below 70%). Suggest generating a new, perhaps easier, quiz on that topic.
2.  **Reinforce Strengths:** If a user is scoring very high (e.g., above 90%) on a topic, challenge them by suggesting a harder quiz or recommending they challenge a friend.
3.  **Encourage Review:** If a book hasn't been studied recently (no recent quiz attempts), recommend reviewing flashcards or summarizing the document to refresh their memory.
4.  **Promote Engagement:** If the user is doing well overall, suggest a fun action like challenging a friend on their strongest subject.
5.  **Be Idle If Necessary:** If the user's activity is low or they are performing consistently well across the board, it's okay to choose the 'IDLE' agent. Not every analysis needs to result in a new task.

**User's Data:**
- **Profile:** Name: {{{userProfile.displayName}}}, Points: {{{userProfile.points}}}, Streak: {{{userProfile.loginStreak}}} days.
- **Books Owned:** 
  {{#each books}}
  - "{{title}}" ({{flashcards.length}} flashcards, {{savedQuizzes.length}} quiz sets)
  {{/each}}
- **Recent Quiz History:**
  {{#each quizHistory}}
  - Topic: "{{bookTitle}}", Score: {{score}}%
  {{/each}}

Based on this complete picture, determine the best next step and output your decision in the required JSON format. Provide a clear, user-facing 'reasoning' for your choice.`,
});

const orchestratorFlow = ai.defineFlow(
  {
    name: 'orchestratorFlow',
    inputSchema: OrchestratorInputSchema,
    outputSchema: OrchestratorOutputSchema,
  },
  async (input) => {
    // In a real-world scenario, you might add more logic here to pre-process data.
    // For now, we pass the data directly to the prompt.
    const { output } = await prompt(input);
    return output!;
  }
);
