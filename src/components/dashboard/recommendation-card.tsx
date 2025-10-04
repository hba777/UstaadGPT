
"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lightbulb, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserBooks } from "@/lib/firestore";

interface Recommendation {
    id: string;
    agent: string;
    parameters: {
        topic?: string;
        reasoning: string;
        difficulty?: 'easy' | 'medium' | 'hard';
    };
}

export function RecommendationCard() {
    const { user } = useAuthContext();
    const router = useRouter();
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, "recommendations"),
            where("userId", "==", user.uid),
            where("viewed", "==", false),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setRecommendation({ id: doc.id, ...doc.data() } as Recommendation);
            } else {
                setRecommendation(null);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching recommendations: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAction = async () => {
        if (!recommendation || !user) return;
        
        // Find the book ID for the recommended topic
        const books = await getUserBooks(user.uid);
        const targetBook = books.find(book => book.title === recommendation.parameters.topic);

        if (targetBook && targetBook.id) {
            // Mark as viewed before navigating
            await handleDismiss();
            router.push(`/my-books/${targetBook.id}`);
        }
    };

    const handleDismiss = async () => {
        if (!recommendation) return;
        const recDocRef = doc(db, "recommendations", recommendation.id);
        await updateDoc(recDocRef, { viewed: true });
        setRecommendation(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 rounded-lg border border-dashed p-4">
                <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                <div className="space-y-1">
                    <p className="font-semibold text-muted-foreground">Checking for new recommendations...</p>
                </div>
            </div>
        )
    }

    if (!recommendation) {
        return null; // Don't render anything if there are no recommendations
    }

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border-2 border-primary/50 bg-primary/10 p-4 animate-in fade-in-50">
            <div className="flex-shrink-0">
                <div className="p-3 bg-primary/20 rounded-full">
                    <Lightbulb className="h-6 w-6 text-primary" />
                </div>
            </div>
            <div className="flex-grow">
                <p className="font-bold text-primary-foreground">Recommended for you</p>
                <p className="text-sm text-primary-foreground/80">{recommendation.parameters.reasoning}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 self-start sm:self-center">
                 {recommendation.parameters.topic && (
                    <Button onClick={handleAction} size="sm">
                        Review Topic
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                 )}
                <Button onClick={handleDismiss} size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/20">
                    <X className="h-4 w-4 text-primary-foreground/80" />
                </Button>
            </div>
        </div>
    );
}
