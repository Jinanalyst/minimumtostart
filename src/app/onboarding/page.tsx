"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Interview, initialAnswers, type Answers } from "@/components/product";
import { loadAnswers, saveAnswers } from "@/lib/project-store";

export default function OnboardingPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnswers(loadAnswers()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function updateAnswers(next: Answers) {
    setAnswers(next);
    saveAnswers(next);
  }

  return (
    <Interview
      answers={answers}
      setAnswers={updateAnswers}
      onBack={() => router.push("/")}
      onComplete={() => {
        saveAnswers(answers);
        router.push("/analyzing");
      }}
    />
  );
}
