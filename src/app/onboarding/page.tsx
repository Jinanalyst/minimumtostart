"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Interview, initialAnswers, type Answers } from "@/components/product";
import { loadAnswers, saveAnswers } from "@/lib/project-store";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { bindWorkspaceToAccount } from "@/lib/workspace-session";

export default function OnboardingPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;

    async function requireAccount() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        if (active) router.replace("/login?next=/onboarding");
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        router.replace("/login?next=/onboarding");
        return;
      }
      bindWorkspaceToAccount(data.user.id);
      setAnswers(loadAnswers());
      setAuthChecked(true);
    }

    requireAccount();
    return () => {
      active = false;
    };
  }, [router]);

  function updateAnswers(next: Answers) {
    setAnswers(next);
    saveAnswers(next);
  }

  if (!authChecked) {
    return (
      <main className="analyzing-page">
        <div className="analysis-orbit"><i /><i /><i /><span>01</span></div>
        <span className="canvas-kicker">CHECKING YOUR ACCOUNT</span>
      </main>
    );
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
