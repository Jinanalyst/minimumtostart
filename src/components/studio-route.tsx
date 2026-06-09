"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initialAnswers, Studio, type Answers } from "@/components/product";
import { loadAnswers } from "@/lib/project-store";

type Tab = "strategy" | "landing" | "mindmap" | "leads" | "emails";

const routes: Record<Tab, string> = {
  strategy: "/canvas",
  landing: "/builder",
  mindmap: "/mindmap",
  leads: "/leads",
  emails: "/emails",
};

export function StudioRoute({ tab }: { tab: Tab }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnswers(loadAnswers()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <Studio answers={answers} initialTab={tab} onHome={() => router.push("/")} onNavigate={(next) => router.push(routes[next])} onPublish={() => router.push("/publish")} />;
}
