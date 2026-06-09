"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initialAnswers, Studio, type Answers } from "@/components/product";
import { loadAnswers } from "@/lib/project-store";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { bindWorkspaceToAccount } from "@/lib/workspace-session";

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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.replace(`/login?next=${encodeURIComponent(routes[tab])}`);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent(routes[tab])}`);
        return;
      }

      bindWorkspaceToAccount(data.user.id);
      setAnswers(loadAnswers());
      setAuthChecked(true);
    }

    loadWorkspace();
    return () => {
      active = false;
    };
  }, [router, tab]);

  if (!authChecked) {
    return (
      <main className="analyzing-page">
        <div className="analysis-orbit"><i /><i /><i /><span>01</span></div>
        <span className="canvas-kicker">LOADING YOUR WORKSPACE</span>
      </main>
    );
  }

  return <Studio answers={answers} initialTab={tab} onHome={() => router.push("/")} onAccount={() => router.push("/account")} onNavigate={(next) => router.push(routes[next])} onPublish={() => router.push("/publish")} />;
}
