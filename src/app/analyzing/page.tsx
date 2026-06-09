"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadAnswers } from "@/lib/project-store";

const steps = ["답변에서 핵심 고객 찾기", "가장 빠른 검증 방식 선택", "MVP Canvas 구성", "첫 출시 흐름 연결"];

export default function AnalyzingPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setInterval(
      () => setActive((current) => Math.min(current + 1, steps.length - 1)),
      650,
    );

    async function generate() {
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loadAnswers()),
        });
        if (!response.ok) throw new Error("MVP 생성 요청에 실패했습니다.");
        const result = await response.json();
        window.localStorage.setItem("minimumtostart.generated", JSON.stringify(result.project));
        window.localStorage.setItem(
          "minimumtostart.canvas",
          JSON.stringify({
            customer: result.project.customer,
            pain: result.project.pain,
            mvp: result.project.mvp,
            offer: result.project.offer,
          }),
        );
        if (result.projectId) window.localStorage.setItem("minimumtostart.projectId", result.projectId);
        if (!cancelled) {
          setActive(steps.length - 1);
          window.setTimeout(() => router.push("/canvas"), 500);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "MVP 생성에 실패했습니다.");
      } finally {
        window.clearInterval(timer);
      }
    }

    generate();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [router]);

  return (
    <main className="analyzing-page">
      <div className="analysis-orbit"><i /><i /><i /><span>AI</span></div>
      <div className="eyebrow"><span /> BUILDING YOUR MVP</div>
      <h1>답변을 실행 가능한<br />첫 버전으로 바꾸고 있어요.</h1>
      <div className="analysis-steps">
        {steps.map((step, index) => <p className={index <= active ? "done" : ""} key={step}><b>{index < active ? "✓" : String(index + 1).padStart(2, "0")}</b>{step}</p>)}
      </div>
      {error && <div className="analysis-error"><p>{error}</p><button onClick={() => window.location.reload()}>다시 시도</button><button onClick={() => router.push("/canvas")}>데모 결과로 계속</button></div>}
    </main>
  );
}
