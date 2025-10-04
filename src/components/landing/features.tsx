"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Book, Layers, MessageSquare, Swords } from "lucide-react";

const features = [
  {
    icon: <Book className="w-8 h-8" />,
    title: "AI Summaries & Books",
    description: "Upload any PDF and get instant, concise summaries. Save documents as 'Books' to power your study tools.",
  },
  {
    icon: <Layers className="w-8 h-8" />,
    title: "Dynamic Flashcards",
    description: "Automatically generate flashcards for key terms and concepts from your documents to test your memory.",
  },
  {
    icon: <Swords className="w-8 h-8" />,
    title: "Quiz Challenges",
    description: "Create quizzes from your material and challenge your friends to see who knows the content best.",
  },
  {
    icon: <MessageSquare className="w-8 h-8" />,
    title: "AI Tutor Chatbot",
    description: "Ask questions about your document and get instant, context-aware answers to deepen your understanding.",
  },
];

export function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="features" className="container py-24 sm:py-32 space-y-8">
      <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
        Everything You Need to{" "}
        <span className="text-primary">Succeed</span>
      </h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={itemVariants}>
            <Card className="h-full bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <div className="mb-4 text-primary">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="pt-2">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
