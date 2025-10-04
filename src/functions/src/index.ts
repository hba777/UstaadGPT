
import * as functions from "firebase-functions/v2/scheduler";
import {getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";
import {runOrchestrator} from "../../src/ai/flows/orchestrator";
import {UserProfile} from "../../src/models/user";

// Initialize Firebase Admin SDK
initializeApp();

// This is the function that will be triggered by Cloud Scheduler
export const runDailyOrchestration = functions.onSchedule(
  "every 24 hours",
  async (event) => {
    const db = getFirestore();
    console.log("Starting daily orchestration for all users.");

    // 1. Get all users from Firestore
    const usersSnapshot = await db.collection("users").get();
    if (usersSnapshot.empty) {
      console.log("No users found to process.");
      return;
    }

    // 2. Loop through each user and run the orchestrator
    for (const userDoc of usersSnapshot.docs) {
      const userProfile = userDoc.data() as UserProfile;
      const userId = userProfile.uid;
      console.log(`Processing user: ${userId} (${userProfile.displayName})`);

      try {
        // 3. Fetch all necessary data for this user
        const booksSnapshot = await db.collection("books")
          .where("userId", "==", userId).get();
        const books = booksSnapshot.docs.map((doc) => doc.data());

        const quizHistorySnapshot = await db.collection("quizAttempts")
          .where("userId", "==", userId).limit(20).get();
        const quizHistory = quizHistorySnapshot.docs.map((doc) => doc.data());

        // 4. Run the orchestrator flow with the user's data
        const orchestratorResult = await runOrchestrator({
          userProfile,
          books: books.map((b) => ({
            title: b.title,
            flashcards: b.flashcards || [],
            savedQuizzes: b.savedQuizzes || [],
          })),
          quizHistory: quizHistory.map((h) => ({
            bookTitle: h.bookTitle,
            score: h.score,
            attemptedAt: h.attemptedAt.toDate().toISOString(),
          })),
        });

        console.log(
          `Orchestrator recommended action for ${userId}: ` +
          `${orchestratorResult.agent}`
        );

        // 5. Store the recommendation in Firestore
        // This is what the frontend will listen to for notifications.
        if (orchestratorResult.agent !== "IDLE") {
          await db.collection("recommendations").add({
            userId: userId,
            agent: orchestratorResult.agent,
            parameters: orchestratorResult.parameters,
            createdAt: new Date(),
            viewed: false,
          });
          console.log(`Recommendation stored for user ${userId}.`);
        }
      } catch (error) {
        console.error(
          `Failed to run orchestrator for user ${userId}:`, error
        );
        // Continue to the next user even if one fails
      }
    }
    console.log("Finished daily orchestration.");
  });
