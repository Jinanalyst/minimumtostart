import type { Answers } from "@/components/product";

export type GeneratedProject = {
  summary: string;
  customer: string;
  pain: string;
  mvp: string;
  why: string;
  offer: string;
  headline: string;
  subheadline: string;
  cta: string;
  monetization: string;
  pricing: string;
  launchPlan: string[];
  emails: { delay: string; subject: string; preview: string; body: string }[];
};

export function fallbackProject(answers: Answers): GeneratedProject {
  const customer = answers.customer || "첫 제품을 준비하는 1인 창업자";
  const pain = answers.problem || "무엇부터 검증해야 할지 몰라 시작하지 못함";
  const offer =
    answers.idea || "질문에 답하면 가장 작은 MVP와 출시 계획을 만들어주는 서비스";

  return {
    summary: offer,
    customer,
    pain,
    mvp: answers.validation === "상담 예약 받기" ? "Concierge MVP" : "Landing Page MVP",
    why: "완제품을 만들기 전에 메시지와 실제 수요를 빠르게 검증할 수 있습니다.",
    offer,
    headline: offer,
    subheadline: `${customer}이 겪는 핵심 문제를 가장 작은 실험으로 검증하세요.`,
    cta: "얼리 액세스 신청",
    monetization: "Freemium + one-time launch report",
    pricing: "무료 체험 후 ₩29,000 리포트",
    launchPlan: [
      "고객과 문제 문장 확정",
      "핵심 약속과 가격 가설 작성",
      "랜딩페이지 공개",
      "잠재 고객 10명에게 공유",
      "반응을 바탕으로 메시지 수정",
    ],
    emails: [
      { delay: "즉시", subject: "환영합니다 — 아이디어를 작게 시작해볼까요?", preview: "첫 번째 작은 행동 안내", body: "가입해 주셔서 감사합니다. 오늘은 가장 중요한 고객 한 사람만 정해보세요." },
      { delay: "2일 후", subject: "좋은 MVP는 무엇을 빼느냐에서 시작합니다", preview: "핵심 문제에 집중하는 가이드", body: "첫 버전에서는 고객의 가장 시급한 문제 하나만 해결하세요." },
      { delay: "4일 후", subject: "첫 고객에게 보여주기 전 확인할 세 가지", preview: "출시 전 체크리스트", body: "누구를 위한 것인지, 어떤 결과를 주는지, 다음 행동이 무엇인지 확인하세요." },
      { delay: "7일 후", subject: "이번 주, 어떤 신호를 발견했나요?", preview: "답장을 유도하는 후속 질문", body: "가장 많이 들은 반응을 답장으로 알려주세요. 다음 실험을 함께 정리해드릴게요." },
    ],
  };
}
