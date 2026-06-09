import type { Answers } from "@/components/product";
import { initialAnswers } from "@/components/product";

const ANSWERS_KEY = "minimumtostart.answers";

export function loadAnswers(): Answers {
  if (typeof window === "undefined") return initialAnswers;
  try {
    const saved = window.localStorage.getItem(ANSWERS_KEY);
    return saved ? { ...initialAnswers, ...JSON.parse(saved) } : initialAnswers;
  } catch {
    return initialAnswers;
  }
}

export function saveAnswers(answers: Answers) {
  window.localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
}
