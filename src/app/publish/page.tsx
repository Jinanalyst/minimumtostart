"use client";

import { useRouter } from "next/navigation";

export default function PublishPage() {
  const router = useRouter();

  function exportProject() {
    const content = [
      "# minimumtostart MVP Project",
      "",
      "MVP Canvas, landing page copy, lead form, and email sequence are ready.",
      "",
      "Generated from your onboarding answers.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "my-mvp-plan.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="publish-page">
      <section className="publish-card">
        <div className="publish-check">✓</div>
        <span className="canvas-kicker">READY TO LAUNCH</span>
        <h1>첫 번째 MVP가<br />출시 준비를 마쳤어요.</h1>
        <p>랜딩페이지, 이메일 캡처 폼, 후속 이메일 시퀀스가 하나의 프로젝트로 연결되었습니다.</p>
        <div className="publish-url"><span>YOUR PAGE</span><b>minimumtostart.site/my-first-mvp</b><button>링크 복사</button></div>
        <div className="publish-actions">
          <button className="button button-accent">무료 주소로 공개</button>
          <button className="button button-ghost" onClick={exportProject}>전체 프로젝트 내보내기</button>
          <button className="button button-dark">Builder로 업그레이드</button>
        </div>
        <button className="publish-back" onClick={() => router.push("/builder")}>← 빌더로 돌아가기</button>
      </section>
    </main>
  );
}
