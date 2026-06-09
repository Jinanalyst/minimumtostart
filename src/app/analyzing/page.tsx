"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const steps = ["답변에서 핵심 고객 찾기", "가장 빠른 검증 방식 선택", "MVP Canvas 구성", "첫 출시 흐름 연결"];

export default function AnalyzingPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => {
        if (current >= steps.length - 1) {
          window.clearInterval(timer);
          window.setTimeout(() => router.push("/canvas"), 650);
          return current;
        }
        return current + 1;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <main className="analyzing-page">
      <div className="analysis-orbit"><i /><i /><i /><span>AI</span></div>
      <div className="eyebrow"><span /> BUILDING YOUR MVP</div>
      <h1>답변을 실행 가능한<br />첫 버전으로 바꾸고 있어요.</h1>
      <div className="analysis-steps">
        {steps.map((step, index) => <p className={index <= active ? "done" : ""} key={step}><b>{index < active ? "✓" : String(index + 1).padStart(2, "0")}</b>{step}</p>)}
      </div>
    </main>
  );
}
