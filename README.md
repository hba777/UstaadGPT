# UstaadGPT - Your Personal AI Study Companion

UstaadGPT is a modern, interactive web application designed to supercharge your study sessions. By leveraging the power of Generative AI, it transforms static documents into a dynamic and gamified learning experience. Upload your study materials, and let UstaadGPT help you summarize key concepts, test your knowledge, create flashcards, and even challenge your friends.

## ✨ Key Features

- **Document-Powered Learning**: Upload PDF documents to create "Books" which serve as the foundation for your study sessions.
- **AI-Powered Study Tools**:
    - **Summarizer**: Get concise summaries of lengthy documents in seconds.
    - **Quiz Generator**: Create multiple-choice quizzes based on your document's content to test your understanding.
    - **Flashcard Creator**: Automatically generate flashcards for key terms and concepts.
    - **AI Tutor Chatbot**: Ask questions about your document and get instant, context-aware answers.
    - **Personalized Study Plans**: Tell the AI your goal, and it will generate a day-by-day plan to help you master the material.
    - **Text-to-Speech**: Listen to your flashcards being read aloud for auditory learning and accessibility.
- **Gamification & Progression**:
    - **Points System**: Earn points for completing activities like generating quizzes or getting correct answers.
    - **Daily Streaks**: Maintain a login streak to earn bonus points and build consistent study habits.
    - **Badges & Achievements**: Unlock badges for reaching milestones like creating multiple books or acing quizzes.
- **Social & Competitive Learning**:
    - **Friend System**: Find and add friends to build your study network.
    - **Friends Leaderboard**: See how your points stack up against your friends.
    - **Quiz Challenges**: Send and receive quiz challenges to compete with friends on specific topics.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN/UI](https://ui.shadcn.com/) for a modern, responsive component library.
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **Generative AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or a compatible package manager

### Running Locally

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Firebase**:
    - This project is pre-configured to connect to a Firebase project. To run it against your own Firebase instance, you would need to:
        1. Create a project on the [Firebase Console](https://console.firebase.google.com/).
        2. Enable Firestore and Firebase Authentication (with Google and Email/Password providers).
        3. Copy your project's Firebase configuration object and replace the one in `src/lib/firebase.ts`.

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:9003`.

## 📁 Project Structure

```
.
├── src/
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── (app)/          # Main authenticated application routes (Dashboard, Study, etc.)
│   │   └── (auth)/         # Authentication routes (Login, Signup)
│   ├── ai/                 # Genkit AI flows and configuration
│   │   └── flows/          # Individual AI features (e.g., generate-quiz.ts)
│   ├── components/         # Reusable React components
│   │   ├── study/          # Components specific to the study interface
│   │   └── ui/             # ShadCN/UI components
│   ├── context/            # React Context providers (e.g., AuthContext)
│   ├── lib/                # Core libraries, utilities, and configurations (Firebase, badges, etc.)
│   └── models/             # TypeScript interfaces for data structures (User, Book)
├── public/                 # Static assets
└── ...                     # Configuration files (tailwind, next.config, etc.)
```

This should give you a great overview of the project! Let me know if you'd like to dive into another feature.