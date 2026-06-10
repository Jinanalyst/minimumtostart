"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { saveAnswers } from "@/lib/project-store";

// Lightweight inline markdown renderer for coach replies: **bold**, [label](url), and bare URLs.
// Keeps long links from spilling out of the panel and turns citations into real, clickable links.
function renderRich(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) nodes.push(<br key={`br-${lineIndex}`} />);
    const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let part = 0;
    while ((match = pattern.exec(line)) !== null) {
      if (match.index > last) nodes.push(line.slice(last, match.index));
      const key = `${lineIndex}-${part++}`;
      if (match[1] !== undefined) {
        nodes.push(<strong key={key}>{match[1]}</strong>);
      } else if (match[2] !== undefined) {
        nodes.push(<a key={key} href={match[3]} target="_blank" rel="noreferrer">{match[2]}</a>);
      } else {
        nodes.push(<a key={key} href={match[4]} target="_blank" rel="noreferrer">{match[4]}</a>);
      }
      last = match.index + match[0].length;
    }
    if (last < line.length) nodes.push(line.slice(last));
  });
  return nodes;
}

type StudioTab = "strategy" | "landing" | "mindmap" | "leads" | "emails";
type CircleKey = "skills" | "love" | "market";

export type Answers = {
  stage: string;
  type: string;
  idea: string;
  customer: string;
  problem: string;
  validation: string;
  budget: string;
};

type Section = {
  id: string;
  label: string;
  title: string;
  body: string;
  tone: "light" | "soft" | "dark";
  ctaLabel?: string;
};

type EmailSequenceItem = {
  id: string;
  delay: string;
  subject: string;
  preview: string;
  body: string;
};

type BoardCard = {
  id: string;
  kicker: string;
  question: string;
  answer: string;
  x: number;
  y: number;
  color: "orange" | "green" | "yellow" | "white";
};

type BoardConnection = {
  id: string;
  from: string;
  to: string;
};

type MindMapCircle = {
  title: string;
  hint: string;
  x: number;
  y: number;
  size: number;
  color: string;
};

type BusinessModelSuggestion = {
  name: string;
  fit: string;
  revenue: string;
  test: string;
};

const BOARD_STORAGE_KEY = "minimumtostart.board";
const LANDING_STORAGE_KEY = "minimumtostart.landing";
const MINDMAP_STORAGE_KEY = "minimumtostart.mindmap";
const EMAIL_STORAGE_KEY = "minimumtostart.emails";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function recommendBusinessModels(notes: Record<CircleKey, string[]>): BusinessModelSuggestion[] {
  const text = Object.values(notes).flat().join(" ").toLowerCase();
  const models = [
    {
      name: "컨시어지 MVP",
      keywords: ["상담", "대화", "설명", "코칭", "도움", "서비스", "맞춤"],
      fit: "고객 문제를 직접 해결하며 가장 빠르게 수요와 지불 의사를 확인합니다.",
      revenue: "건별 결제 또는 2~4주 패키지",
      test: "고객 5명에게 유료 진단 또는 대행 서비스를 제안하세요.",
    },
    {
      name: "제품화된 서비스",
      keywords: ["구조", "정리", "디자인", "제작", "마케팅", "분석", "자동화"],
      fit: "반복 가능한 전문 작업을 명확한 결과물과 고정 가격으로 판매합니다.",
      revenue: "고정 패키지 + 월 유지관리",
      test: "결과물, 기간, 가격이 적힌 한 페이지 오퍼로 선결제 1건을 받아보세요.",
    },
    {
      name: "유료 워크숍",
      keywords: ["교육", "가르", "설명", "강의", "사람", "커뮤니티", "경험"],
      fit: "지식과 경험을 실시간 소규모 프로그램으로 검증하기 좋습니다.",
      revenue: "회차별 참가비 또는 기업 워크숍",
      test: "90분 워크숍을 모집해 최소 5명의 유료 참가자를 모아보세요.",
    },
    {
      name: "멤버십 콘텐츠",
      keywords: ["글", "콘텐츠", "뉴스", "리서치", "큐레이션", "정보", "아이디어"],
      fit: "지속적으로 필요한 정보와 템플릿을 정기적으로 제공합니다.",
      revenue: "월간 또는 연간 구독",
      test: "무료 샘플 3개와 유료 대기자 명단으로 반복 수요를 확인하세요.",
    },
    {
      name: "마켓플레이스",
      keywords: ["연결", "매칭", "거래", "공급", "전문가", "고객", "예약"],
      fit: "수요자와 공급자를 수작업으로 연결하며 거래 빈도를 검증합니다.",
      revenue: "거래 수수료 또는 리드 이용료",
      test: "양쪽 참여자 각 5명을 모집해 첫 거래 3건을 직접 성사시키세요.",
    },
    {
      name: "경량 SaaS",
      keywords: ["도구", "앱", "소프트웨어", "자동화", "데이터", "관리", "플랫폼", "ai"],
      fit: "반복 업무의 한 단계를 간단한 도구로 줄이는 모델입니다.",
      revenue: "월 구독 + 사용량 기반 요금",
      test: "노코드 또는 수동 백엔드로 핵심 작업 한 가지를 10명에게 제공하세요.",
    },
  ];

  return models
    .map((model, index) => ({
      ...model,
      score: model.keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 2 : 0), 0) - index * .01,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ name, fit, revenue, test }) => ({ name, fit, revenue, test }));
}

export const initialAnswers: Answers = {
  stage: "",
  type: "",
  idea: "",
  customer: "",
  problem: "",
  validation: "",
  budget: "",
};

const questions = [
  {
    key: "stage" as const,
    kicker: "YOUR STARTING POINT",
    title: "지금 어디쯤 와 있나요?",
    helper: "정답은 없어요. 현재 상태에 가장 가까운 것을 골라주세요.",
    options: ["막연한 아이디어가 있어요", "아이디어가 너무 많아요", "아직 아이디어가 없어요", "기존 비즈니스를 개선하고 싶어요", "클라이언트를 위해 만들어요"],
  },
  {
    key: "type" as const,
    kicker: "BUSINESS SHAPE",
    title: "어떤 형태의 비즈니스를 생각하나요?",
    helper: "잘 모르겠다면 그것도 좋은 답입니다.",
    options: ["SaaS / 앱", "서비스 비즈니스", "마켓플레이스", "커뮤니티", "콘텐츠 / 미디어", "이커머스", "로컬 비즈니스", "아직 모르겠어요"],
  },
  {
    key: "idea" as const,
    kicker: "THE RAW IDEA",
    title: "아이디어를 한 문장으로 적어주세요.",
    helper: "거칠어도 괜찮아요. 함께 다듬기 위한 첫 재료입니다.",
    placeholder: "예: 바쁜 1인 창업자가 매일 무엇을 해야 할지 알려주는 서비스",
  },
  {
    key: "customer" as const,
    kicker: "WHO IT IS FOR",
    title: "누구를 가장 먼저 돕고 싶나요?",
    helper: "모두가 아닌, 첫 번째 고객 한 사람을 떠올려보세요.",
    placeholder: "예: 첫 제품을 준비하는 비개발자 1인 창업자",
  },
  {
    key: "problem" as const,
    kicker: "THE REAL PAIN",
    title: "그 사람은 어떤 문제를 겪고 있나요?",
    helper: "기능보다 답답함, 비용, 시간 낭비를 설명해 주세요.",
    placeholder: "예: 아이디어는 있지만 무엇부터 검증해야 할지 몰라 시작하지 못한다",
  },
  {
    key: "validation" as const,
    kicker: "FIRST PROOF",
    title: "가장 먼저 무엇을 검증하고 싶나요?",
    helper: "첫 MVP의 성공 기준이 됩니다.",
    options: ["이메일 리드 모으기", "선주문 받기", "상담 예약 받기", "가격 테스트하기", "베타 사용자 찾기", "피드백 받기", "커뮤니티 만들기"],
  },
  {
    key: "budget" as const,
    kicker: "YOUR CONSTRAINTS",
    title: "지금 활용할 수 있는 자원은?",
    helper: "제약이 명확할수록 더 현실적인 MVP가 나옵니다.",
    options: ["비용 0원으로 시작", "10만원 이하", "10만–50만원", "직접 개발 가능", "노코드 도구 필요", "제작을 맡기고 싶어요"],
  },
];

const navTabs: { id: StudioTab; label: string; short: string }[] = [
  { id: "strategy", label: "MVP 전략", short: "01" },
  { id: "landing", label: "랜딩페이지", short: "02" },
  { id: "mindmap", label: "아이디어 맵", short: "03" },
  { id: "leads", label: "리드", short: "04" },
  { id: "emails", label: "이메일", short: "05" },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    spark: <><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" /><path d="m5 16 .8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z" /></>,
    map: <><circle cx="12" cy="12" r="3" /><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><path d="m7 7 3 3m7-3-3 3M12 15v5" /></>,
    blocks: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    download: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 21h14" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    cursor: <path d="m5 3 14 8-6 2-3 6Z" />,
    line: <><circle cx="6" cy="17" r="2.5" /><circle cx="18" cy="7" r="2.5" /><path d="m8 15 8-6" /></>,
    note: <><path d="M5 3h14v14l-4 4H5Z" /><path d="M15 21v-4h4" /></>,
    text: <><path d="M5 5h14M12 5v14M8 19h8" /></>,
    zoomIn: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5M10 7v6M7 10h6" /></>,
    zoomOut: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5M7 10h6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function CanvasBoard({ answers, strategy, onStrategyChange, onNext }: {
  answers: Answers;
  strategy: { customer: string; pain: string; mvp: string; offer: string };
  onStrategyChange: (field: "customer" | "pain" | "mvp" | "offer", value: string) => void;
  onNext: () => void;
}) {
  const [zoom, setZoom] = useState(82);
  const [activeTool, setActiveTool] = useState("cursor");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; startClientX: number; startClientY: number; startX: number; startY: number } | null>(null);
  const [cards, setCards] = useState<BoardCard[]>(() => [
    { id: "stage", kicker: "01 / STARTING POINT", question: "지금 어디쯤 와 있나요?", answer: answers.stage || "막연한 아이디어가 있어요", x: 90, y: 90, color: "white" },
    { id: "idea", kicker: "02 / RAW IDEA", question: "어떤 아이디어인가요?", answer: answers.idea || "아이디어를 명확한 MVP로 바꾸는 서비스", x: 420, y: 70, color: "orange" },
    { id: "customer", kicker: "03 / TARGET CUSTOMER", question: "누구를 돕고 싶나요?", answer: strategy.customer, x: 760, y: 110, color: "green" },
    { id: "problem", kicker: "04 / REAL PROBLEM", question: "고객의 가장 큰 문제는?", answer: strategy.pain, x: 230, y: 350, color: "yellow" },
    { id: "validation", kicker: "05 / FIRST PROOF", question: "무엇을 먼저 검증할까요?", answer: answers.validation || "이메일 리드 모으기", x: 570, y: 370, color: "white" },
    { id: "mvp", kicker: "AI / RECOMMENDATION", question: "가장 적합한 MVP", answer: strategy.mvp, x: 900, y: 390, color: "orange" },
    { id: "offer", kicker: "AI / CORE OFFER", question: "고객에게 약속할 결과", answer: strategy.offer, x: 470, y: 650, color: "green" },
  ]);
  const [connections, setConnections] = useState<BoardConnection[]>([
    { id: "stage-idea", from: "stage", to: "idea" },
    { id: "idea-customer", from: "idea", to: "customer" },
    { id: "idea-problem", from: "idea", to: "problem" },
    { id: "problem-validation", from: "problem", to: "validation" },
    { id: "validation-mvp", from: "validation", to: "mvp" },
    { id: "mvp-offer", from: "mvp", to: "offer" },
  ]);
  const [boardReady, setBoardReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(BOARD_STORAGE_KEY);
        if (saved) {
          const board = JSON.parse(saved) as { cards?: BoardCard[]; connections?: BoardConnection[]; zoom?: number };
          if (board.cards?.length) setCards(board.cards);
          if (board.connections) setConnections(board.connections);
          if (board.zoom) setZoom(board.zoom);
        }
      } catch {
        // Keep the generated board when saved editor data is unavailable.
      } finally {
        setBoardReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!boardReady) return;
    window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify({ cards, connections, zoom }));
  }, [boardReady, cards, connections, zoom]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCards((current) => current.map((card) => {
      if (card.id === "customer") return { ...card, answer: strategy.customer };
      if (card.id === "problem") return { ...card, answer: strategy.pain };
      if (card.id === "mvp") return { ...card, answer: strategy.mvp };
      if (card.id === "offer") return { ...card, answer: strategy.offer };
      return card;
    })));
    return () => window.cancelAnimationFrame(frame);
  }, [strategy]);

  function updateCard(id: string, changes: Partial<BoardCard>) {
    setCards((current) => current.map((card) => card.id === id ? { ...card, ...changes } : card));
    const answer = changes.answer;
    if (answer === undefined) return;
    if (id === "problem") onStrategyChange("pain", answer);
    if (id === "customer" || id === "mvp" || id === "offer") onStrategyChange(id, answer);
  }

  function startDrag(event: React.PointerEvent<HTMLElement>, card: BoardCard) {
    if (activeTool !== "cursor") return;
    const target = event.target as HTMLElement;
    setSelectedCardId(card.id);
    if (target.closest("textarea, input, button, select")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging({ id: card.id, startClientX: event.clientX, startClientY: event.clientY, startX: card.x, startY: card.y });
  }

  function drag(event: React.PointerEvent<HTMLElement>) {
    if (!dragging) return;
    setCards((current) => current.map((card) => card.id === dragging.id ? {
      ...card,
      x: Math.max(18, dragging.startX + (event.clientX - dragging.startClientX) / (zoom / 100)),
      y: Math.max(18, dragging.startY + (event.clientY - dragging.startClientY) / (zoom / 100)),
    } : card));
  }

  function addCard(kind: "note" | "text" = "note") {
    const id = createId(kind);
    const offset = cards.length * 22;
    setCards((current) => [...current, {
      id,
      kicker: kind === "text" ? "TEXT BLOCK" : "NEW THOUGHT",
      question: kind === "text" ? "새로운 제목" : "새로운 질문",
      answer: kind === "text" ? "강조할 문장을 입력하세요." : "여기에 생각을 적어보세요.",
      x: 120 + (offset % 360),
      y: 120 + (offset % 420),
      color: kind === "text" ? "yellow" : "white",
    }]);
    setSelectedCardId(id);
    setActiveTool("cursor");
  }

  function duplicateCard(card: BoardCard) {
    const id = createId("card");
    setCards((current) => [...current, { ...card, id, x: card.x + 36, y: card.y + 36 }]);
    setSelectedCardId(id);
  }

  function deleteCard(id: string) {
    setCards((current) => current.filter((card) => card.id !== id));
    setConnections((current) => current.filter((connection) => connection.from !== id && connection.to !== id));
    setSelectedCardId((current) => current === id ? null : current);
    setConnectionStart((current) => current === id ? null : current);
  }

  function deleteCardConnections(id: string) {
    setConnections((current) => current.filter((connection) => connection.from !== id && connection.to !== id));
  }

  function selectForConnection(cardId: string) {
    if (!connectionStart) {
      setConnectionStart(cardId);
      return;
    }
    if (connectionStart !== cardId) {
      const duplicate = connections.some((connection) =>
        (connection.from === connectionStart && connection.to === cardId)
        || (connection.from === cardId && connection.to === connectionStart));
      if (!duplicate) {
        setConnections((current) => [...current, { id: createId("line"), from: connectionStart, to: cardId }]);
      }
    }
    setConnectionStart(null);
    setActiveTool("cursor");
  }

  function connectionPath(connection: BoardConnection) {
    const from = cards.find((card) => card.id === connection.from);
    const to = cards.find((card) => card.id === connection.to);
    if (!from || !to) return "";
    const fromWidth = 270;
    const fromHeight = 190;
    const toWidth = 270;
    const toHeight = 190;
    const fromCenter = { x: from.x + fromWidth / 2, y: from.y + fromHeight / 2 };
    const toCenter = { x: to.x + toWidth / 2, y: to.y + toHeight / 2 };
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      const direction = dx >= 0 ? 1 : -1;
      const x1 = fromCenter.x + direction * fromWidth / 2;
      const y1 = fromCenter.y;
      const x2 = toCenter.x - direction * toWidth / 2;
      const y2 = toCenter.y;
      const curve = Math.max(45, Math.abs(x2 - x1) * .42);
      return `M${x1} ${y1} C${x1 + direction * curve} ${y1} ${x2 - direction * curve} ${y2} ${x2} ${y2}`;
    }

    const direction = dy >= 0 ? 1 : -1;
    const x1 = fromCenter.x;
    const y1 = fromCenter.y + direction * fromHeight / 2;
    const x2 = toCenter.x;
    const y2 = toCenter.y - direction * toHeight / 2;
    const curve = Math.max(45, Math.abs(y2 - y1) * .42);
    return `M${x1} ${y1} C${x1} ${y1 + direction * curve} ${x2} ${y2 - direction * curve} ${x2} ${y2}`;
  }

  return (
    <div className="board-shell">
      <div className="board-topbar">
        <div><span className="canvas-kicker">MVP CANVAS / GENERATED FROM YOUR ANSWERS</span><b>질문과 답변을 움직이며 생각을 정리하세요</b></div>
        <button className="button button-dark button-small" onClick={onNext}>이 보드로 랜딩페이지 만들기 <Icon name="arrow" size={15} /></button>
      </div>
      <div className="board-viewport" onPointerMove={drag} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)}>
        <div className="board-tools">
          {[
            ["cursor", "cursor", "선택"],
            ["line", "line", connectionStart ? "연결할 두 번째 노트 선택" : "노트 연결"],
          ].map(([id, icon, label]) => <button className={activeTool === id ? "active" : ""} key={id} title={label} onClick={() => { setActiveTool(id); setConnectionStart(null); }}><Icon name={icon} /></button>)}
          <button title="메모 추가" onClick={() => addCard("note")}><Icon name="note" /></button>
          <button title="텍스트 추가" onClick={() => addCard("text")}><Icon name="text" /></button>
          <i />
          <button title="카드 추가" onClick={() => addCard("note")}><Icon name="plus" /></button>
        </div>
        <div className="board-stage" style={{ transform: `scale(${zoom / 100})` }}>
          <svg className="board-lines" width="1400" height="900" viewBox="0 0 1400 900" aria-hidden="true">
            <defs>
              <marker id="connection-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0 0 7 3.5 0 7Z" />
              </marker>
            </defs>
            {connections.map((connection) => <path className="board-connection" d={connectionPath(connection)} key={connection.id} markerEnd="url(#connection-arrow)" />)}
          </svg>
          {cards.map((card) => (
            <article
              className={`board-card card-${card.color} ${dragging?.id === card.id ? "dragging" : ""} ${selectedCardId === card.id ? "selected" : ""} ${connectionStart === card.id ? "connecting" : ""}`}
              key={card.id}
              style={{ left: card.x, top: card.y }}
              onPointerDown={(event) => startDrag(event, card)}
              onClick={() => activeTool === "line" ? selectForConnection(card.id) : setSelectedCardId(card.id)}
            >
              <i className="board-port board-port-top" aria-hidden="true" />
              <i className="board-port board-port-bottom" aria-hidden="true" />
              <div className="board-card-head">
                <input aria-label="카드 분류" value={card.kicker} onChange={(event) => updateCard(card.id, { kicker: event.target.value })} />
                <div>
                  <button title="카드 복제" onClick={(event) => { event.stopPropagation(); duplicateCard(card); }}><Icon name="copy" size={13} /></button>
                  <button title="카드 삭제" onClick={(event) => { event.stopPropagation(); deleteCard(card.id); }}><Icon name="trash" size={13} /></button>
                </div>
              </div>
              <input className="board-question" aria-label="카드 질문" value={card.question} onChange={(event) => updateCard(card.id, { question: event.target.value })} />
              <textarea value={card.answer} onChange={(event) => updateCard(card.id, { answer: event.target.value })} />
              {selectedCardId === card.id && (
                <div className="card-options">
                  <div className="card-colors" aria-label="카드 색상">
                    {(["white", "orange", "green", "yellow"] as BoardCard["color"][]).map((color) => (
                      <button className={card.color === color ? "active" : ""} key={color} title={color} onClick={(event) => { event.stopPropagation(); updateCard(card.id, { color }); }} />
                    ))}
                  </div>
                  {connections.some((connection) => connection.from === card.id || connection.to === card.id) && <button className="remove-connections" onClick={(event) => { event.stopPropagation(); deleteCardConnections(card.id); }}>연결 해제</button>}
                </div>
              )}
              <small>클릭해서 수정 · 드래그해서 이동</small>
            </article>
          ))}
          <div className="board-summary">
            <Icon name="spark" />
            <span><b>AI가 발견한 연결</b>이 고객은 “완성된 제품”보다 “무엇을 먼저 검증할지 알려주는 명확한 시작”을 원합니다.</span>
          </div>
        </div>
        <div className="board-bottom">
          <span>{cards.length} cards · {connections.length} connections{activeTool === "line" ? connectionStart ? " · 연결할 두 번째 노트를 선택하세요" : " · 시작 노트를 선택하세요" : ""}</span>
          <div><button onClick={() => setZoom(Math.max(50, zoom - 10))}><Icon name="zoomOut" size={15} /></button><input type="range" min="50" max="120" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><button onClick={() => setZoom(Math.min(120, zoom + 10))}><Icon name="zoomIn" size={15} /></button><b>{zoom}%</b></div>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <button className="brand" aria-label="Minimum to Start home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <Image className="brand-logo" src="/brand-logo.png" alt="Minimum to Start" width={1039} height={271} priority />
    </button>
  );
}

export function Home({ onStart }: { onStart: () => void }) {
  return (
    <main className="home">
      <header className="topbar shell">
        <Brand />
        <nav className="desktop-nav">
          <a href="#how">진행 방식</a>
          <a href="#workspace">작업 공간</a>
          <a href="#pricing">가격</a>
          <a href="/login">로그인</a>
        </nav>
        <button className="button button-dark button-small" onClick={onStart}>무료로 시작 <Icon name="arrow" size={15} /></button>
      </header>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span /> IDEA TO LAUNCH</div>
          <h1>아이디어를<br /><em>출시 가능한 MVP로.</em></h1>
          <p>질문에 답하고, 생각을 연결하고, 가장 작은 비즈니스를 설계하세요. 전략부터 랜딩페이지, 리드와 이메일까지 하나의 캔버스에서 완성합니다.</p>
          <div className="hero-actions">
            <button className="button button-accent" onClick={onStart}>아이디어 구체화하기 <Icon name="arrow" /></button>
          </div>
          <div className="hero-notes">
            <span><Icon name="check" size={14} /> 무료로 체험</span>
            <span><Icon name="check" size={14} /> 카드 등록 없음</span>
            <span><Icon name="check" size={14} /> 아이디어만 있으면 시작</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="제품 작업 공간 미리보기">
          <div className="mini-window">
            <div className="mini-top"><i /><i /><i /><span>MY FIRST MVP / CANVAS</span></div>
            <div className="mini-body">
              <aside>
                <b>프로젝트</b>
                <span className="active"><Icon name="blocks" size={14} /> MVP 전략</span>
                <span><Icon name="edit" size={14} /> 랜딩페이지</span>
                <span><Icon name="map" size={14} /> 아이디어 맵</span>
                <span><Icon name="users" size={14} /> 리드</span>
              </aside>
              <div className="mini-canvas">
                <div className="canvas-label">LAUNCH CANVAS</div>
                <div className="mini-card mini-hero-card">
                  <small>YOUR CLEAR PROMISE</small>
                  <strong>아이디어를 7일 안에<br />검증 가능한 MVP로.</strong>
                  <span>막연한 생각을 실행 가능한 계획으로 바꾸세요.</span>
                  <button>얼리 액세스 신청</button>
                </div>
                <div className="mini-float float-one"><Icon name="spark" size={14} /> 더 구체적으로 바꿔볼까요?</div>
                <div className="mini-float float-two">첫 목표 <b>25 leads</b></div>
              </div>
            </div>
          </div>
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
        </div>
      </section>

      <section className="problem-strip">
        <div className="shell strip-grid">
          <p>대부분의 사람은<br /><b>명확히 하기 전에 만듭니다.</b></p>
          <div><strong>01</strong><span>무엇을 만들지<br />결정하지 못하고</span></div>
          <div><strong>02</strong><span>누구를 위한 것인지<br />흐려지고</span></div>
          <div><strong>03</strong><span>검증 전에 시간과<br />비용을 씁니다</span></div>
        </div>
      </section>

      <section className="section shell" id="how">
        <div className="section-heading">
          <div className="eyebrow"><span /> ONE CONNECTED FLOW</div>
          <h2>생각에서 고객까지,<br />끊기지 않는 한 흐름.</h2>
          <p>대화로 정리한 생각이 전략이 되고, 전략이 페이지가 되고, 페이지가 실제 고객 신호를 모읍니다.</p>
        </div>
        <div className="flow-grid">
          {[
            ["01", "Clarify", "질문으로 정리", "거친 아이디어와 강점, 고객의 문제를 명확하게 만듭니다.", "spark"],
            ["02", "Strategize", "MVP 전략 생성", "가장 빠르게 검증할 MVP 유형과 가격, 7일 계획을 제안합니다.", "blocks"],
            ["03", "Create", "캔버스에서 제작", "랜딩페이지와 마인드맵을 자유롭게 편집하고 AI와 의논합니다.", "edit"],
            ["04", "Launch", "리드와 이메일", "페이지를 공개하고 리드를 모아 후속 이메일을 보냅니다.", "send"],
          ].map(([num, en, ko, desc, icon]) => (
            <article className="flow-card" key={num}>
              <div className="flow-top"><span>{num}</span><Icon name={icon} /></div>
              <small>{en}</small>
              <h3>{ko}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-section" id="workspace">
        <div className="shell workspace-grid">
          <div className="workspace-copy">
            <div className="eyebrow light"><span /> YOUR THINKING SPACE</div>
            <h2>만드는 곳이자,<br />함께 생각하는 곳.</h2>
            <p>완성된 결과를 받는 데서 끝나지 않습니다. 블록을 옮기고 문장을 고치고, AI 코치에게 질문하며 당신의 방식으로 발전시키세요.</p>
            <ul>
              <li><Icon name="check" /> 자유로운 섹션 편집과 재정렬</li>
              <li><Icon name="check" /> 선택한 블록을 AI와 함께 수정</li>
              <li><Icon name="check" /> 전략, 페이지, 마케팅이 하나의 프로젝트로 연결</li>
            </ul>
            <button className="button button-light" onClick={onStart}>작업 공간 열기 <Icon name="arrow" /></button>
          </div>
          <div className="venn-preview">
            <div className="venn-title"><Icon name="map" /> IDEA OPPORTUNITY MAP</div>
            <div className="venn-stage">
              <div className="venn-circle skill"><b>잘하는 것</b><span>설명하기<br />구조화하기<br />빠르게 만들기</span></div>
              <div className="venn-circle love"><b>좋아하는 것</b><span>새로운 아이디어<br />사람 돕기<br />디자인</span></div>
              <div className="venn-circle market"><b>시장이 원하는 것</b><span>빠른 검증<br />쉬운 시작<br />실제 고객</span></div>
              <div className="venn-center">사업<br />기회</div>
            </div>
            <div className="opportunity-note"><span>FOUND OPPORTUNITY</span><b>“초보 창업자의 아이디어를 빠르게 검증하도록 돕는 서비스”</b></div>
          </div>
        </div>
      </section>

      <section className="section shell" id="pricing">
        <div className="section-heading centered">
          <div className="eyebrow"><span /> START SMALL</div>
          <h2>아이디어 하나부터 시작하세요.</h2>
          <p>먼저 명확하게 만들고, 실제 신호가 생길 때 더 크게 키우세요.</p>
        </div>
        <div className="pricing-grid">
          <article><small>FREE</small><h3>₩0</h3><p>아이디어를 처음 정리할 때</p><ul><li>아이디어 맵 1개</li><li>MVP 미리보기 1개</li><li>랜딩페이지 초안</li><li>리드 25명</li></ul><button onClick={onStart}>무료로 시작</button></article>
          <article className="featured"><div className="popular">MOST POPULAR</div><small>BUILDER</small><h3>₩49,000 <i>/ 월</i></h3><p>아이디어를 실제로 출시할 때</p><ul><li>프로젝트 10개</li><li>AI 수정과 캔버스 편집</li><li>랜딩페이지 공개</li><li>리드 5,000명</li><li>이메일 캠페인</li></ul><button onClick={onStart}>Builder로 시작</button></article>
          <article><small>ONE-TIME</small><h3>₩29,000</h3><p>한 번에 전체 계획이 필요할 때</p><ul><li>전체 MVP 전략 리포트</li><li>가격과 수익 모델</li><li>7일 출시 계획</li><li>이메일 시퀀스</li></ul><button onClick={onStart}>리포트 만들기</button></article>
        </div>
      </section>

      <section className="final-cta">
        <div className="shell">
          <div className="eyebrow light"><span /> YOUR FIRST STEP</div>
          <h2>좋은 아이디어보다 필요한 건,<br /><em>검증할 수 있는 첫 번째 버전.</em></h2>
          <button className="button button-accent" onClick={onStart}>지금 MVP 만들기 <Icon name="arrow" /></button>
        </div>
      </section>
      <footer className="footer shell"><Brand /><span>© 2026 minimumtostart</span><p>Clarify · Create · Launch</p></footer>
    </main>
  );
}

export function Interview({ answers, setAnswers, onBack, onComplete }: {
  answers: Answers;
  setAnswers: (answers: Answers) => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const question = questions[step];
  const value = answers[question.key];
  const canContinue = value.trim().length > 1;

  function next() {
    if (step === questions.length - 1) onComplete();
    else setStep((current) => current + 1);
  }

  return (
    <main className="interview-page">
      <header className="interview-header">
        <Brand />
        <button className="text-button" onClick={onBack}>나가기</button>
      </header>
      <div className="interview-progress"><i style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
      <section className="interview-shell">
        <aside>
          <span>STEP</span>
          <strong>{String(step + 1).padStart(2, "0")}<i>/ {String(questions.length).padStart(2, "0")}</i></strong>
          <p>당신의 답변으로<br />MVP 캔버스를 만들고 있어요.</p>
        </aside>
        <div className="question-card">
          <div className="eyebrow"><span /> {question.kicker}</div>
          <h1>{question.title}</h1>
          <p>{question.helper}</p>
          {"options" in question && question.options ? (
            <div className="option-grid">
              {question.options.map((option) => (
                <button className={value === option ? "selected" : ""} key={option} onClick={() => setAnswers({ ...answers, [question.key]: option })}>
                  <i>{value === option ? <Icon name="check" size={15} /> : null}</i>{option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              autoFocus
              value={value}
              placeholder={"placeholder" in question ? question.placeholder : ""}
              onChange={(event) => setAnswers({ ...answers, [question.key]: event.target.value })}
            />
          )}
          <div className="question-actions">
            <button className="button button-ghost" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>이전</button>
            <button className="button button-accent" disabled={!canContinue} onClick={next}>{step === questions.length - 1 ? "MVP 생성하기" : "계속하기"} <Icon name="arrow" /></button>
          </div>
        </div>
      </section>
      <div className="coach-note"><Icon name="spark" /><span><b>작게 시작해도 괜찮아요.</b><br />좋은 MVP는 완벽한 답보다 명확한 가설에서 시작합니다.</span></div>
    </main>
  );
}

function MindMap({ notes, setNotes, onUseIdea }: {
  notes: Record<CircleKey, string[]>;
  setNotes: (notes: Record<CircleKey, string[]>) => void;
  onUseIdea: (idea: string, model: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<CircleKey, string>>({ skills: "", love: "", market: "" });
  const [circles, setCircles] = useState<Record<CircleKey, MindMapCircle>>({
    skills: { title: "잘하는 것", hint: "경험, 기술, 남들이 자주 부탁하는 것", x: 55, y: 55, size: 350, color: "#ef6a42" },
    love: { title: "좋아하는 것", hint: "시간 가는 줄 모르고 하는 것", x: 285, y: 55, size: 350, color: "#d39a32" },
    market: { title: "시장이 원하는 것", hint: "사람들이 돈과 시간을 쓰는 문제", x: 170, y: 300, size: 350, color: "#47745f" },
  });
  const [selectedCircle, setSelectedCircle] = useState<CircleKey>("skills");
  const [selectedModel, setSelectedModel] = useState(0);
  const [customIdea, setCustomIdea] = useState("");
  const [mindMapReady, setMindMapReady] = useState(false);
  const [draggingCircle, setDraggingCircle] = useState<{
    key: CircleKey;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [draggedNote, setDraggedNote] = useState<{ key: CircleKey; index: number } | null>(null);

  function addNote(key: CircleKey) {
    const value = drafts[key].trim();
    if (!value) return;
    setNotes({ ...notes, [key]: [...notes[key], value] });
    setDrafts({ ...drafts, [key]: "" });
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(MINDMAP_STORAGE_KEY);
        if (saved) {
          const mindMap = JSON.parse(saved) as {
            notes?: Record<CircleKey, string[]>;
            circles?: Record<CircleKey, MindMapCircle>;
            customIdea?: string;
            selectedModel?: number;
          };
          if (mindMap.notes) setNotes(mindMap.notes);
          if (mindMap.circles) setCircles(mindMap.circles);
          if (mindMap.customIdea) setCustomIdea(mindMap.customIdea);
          if (typeof mindMap.selectedModel === "number") setSelectedModel(mindMap.selectedModel);
        }
      } catch {
        // Keep the default opportunity map if saved data cannot be loaded.
      } finally {
        setMindMapReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [setNotes]);

  useEffect(() => {
    if (!mindMapReady) return;
    window.localStorage.setItem(MINDMAP_STORAGE_KEY, JSON.stringify({ notes, circles, customIdea, selectedModel }));
  }, [circles, customIdea, mindMapReady, notes, selectedModel]);

  function updateNote(key: CircleKey, index: number, value: string) {
    setNotes({ ...notes, [key]: notes[key].map((note, noteIndex) => noteIndex === index ? value : note) });
  }

  function deleteNote(key: CircleKey, index: number) {
    setNotes({ ...notes, [key]: notes[key].filter((_, noteIndex) => noteIndex !== index) });
  }

  function moveNote(targetKey: CircleKey) {
    if (!draggedNote) return;
    if (draggedNote.key === targetKey) {
      setDraggedNote(null);
      return;
    }
    const note = notes[draggedNote.key][draggedNote.index];
    if (!note) return;
    const next = {
      ...notes,
      [draggedNote.key]: notes[draggedNote.key].filter((_, index) => index !== draggedNote.index),
      [targetKey]: [...notes[targetKey], note],
    };
    setNotes(next);
    setDraggedNote(null);
  }

  function startCircleDrag(event: React.PointerEvent<HTMLDivElement>, key: CircleKey) {
    if ((event.target as HTMLElement).closest(".mind-note")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedCircle(key);
    setDraggingCircle({
      key,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: circles[key].x,
      startY: circles[key].y,
    });
  }

  function dragCircle(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingCircle) return;
    const editor = event.currentTarget;
    setCircles((current) => ({
      ...current,
      [draggingCircle.key]: {
        ...current[draggingCircle.key],
        x: Math.max(0, Math.min(editor.scrollWidth - current[draggingCircle.key].size, draggingCircle.startX + event.clientX - draggingCircle.startClientX)),
        y: Math.max(0, Math.min(editor.scrollHeight - current[draggingCircle.key].size, draggingCircle.startY + event.clientY - draggingCircle.startClientY)),
      },
    }));
  }

  function updateCircle(key: CircleKey, changes: Partial<MindMapCircle>) {
    setCircles((current) => ({ ...current, [key]: { ...current[key], ...changes } }));
  }

  const suggestions = recommendBusinessModels(notes);
  const activeSuggestion = suggestions[Math.min(selectedModel, suggestions.length - 1)];
  const generatedIdea = `${notes.skills[0] || "당신의 강점"}을 활용해 ${notes.market[0] || "시장의 문제"}를 해결하는 ${notes.love[0] || "좋아하는 방식"} 기반 ${activeSuggestion.name}`;
  const idea = customIdea.trim() || generatedIdea;
  const circleKeys = Object.keys(circles) as CircleKey[];

  return (
    <div className="mindmap-layout">
      <div className="mindmap-toolbar">
        <div><span className="canvas-kicker">OPPORTUNITY FINDER</span><h2>나만의 사업 기회 찾기</h2><p>원을 움직이고 메모를 편집해 가장 설득력 있는 MVP 모델을 찾으세요.</p></div>
        <button className="button button-dark" onClick={() => onUseIdea(idea, activeSuggestion.name)}>이 모델로 MVP 만들기 <Icon name="arrow" /></button>
      </div>
      <div className="mindmap-workspace">
        <div className="venn-editor" onPointerMove={dragCircle} onPointerUp={() => setDraggingCircle(null)} onPointerCancel={() => setDraggingCircle(null)}>
          {circleKeys.map((key) => {
            const circle = circles[key];
            return (
              <div
                className={`edit-circle ${selectedCircle === key ? "selected" : ""}`}
                key={key}
                style={{
                  left: circle.x,
                  top: circle.y,
                  width: circle.size,
                  height: circle.size,
                  borderColor: circle.color,
                  backgroundColor: `${circle.color}24`,
                }}
                onPointerDown={(event) => startCircleDrag(event, key)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveNote(key)}
              >
                <b>{circle.title}</b>
                <div className="mind-notes">
                  {notes[key].map((note, index) => (
                    <div
                      className="mind-note"
                      key={`${key}-${index}`}
                    >
                      <i draggable title="다른 원으로 드래그" onDragStart={() => setDraggedNote({ key, index })} onDragEnd={() => setDraggedNote(null)}>⋮⋮</i>
                      <input aria-label={`${circle.title} 메모`} value={note} onChange={(event) => updateNote(key, index, event.target.value)} />
                      <button title="메모 삭제" onClick={() => deleteNote(key, index)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="edit-center">
            <Icon name="spark" />
            <b>{activeSuggestion.name}</b>
            <textarea aria-label="사업 기회 문장" value={idea} onChange={(event) => setCustomIdea(event.target.value)} />
            <small>{activeSuggestion.revenue}</small>
          </div>
        </div>
        <aside className="mindmap-panel">
          <span className="panel-label">ADD YOUR THOUGHTS</span>
          {circleKeys.map((key) => (
            <div className="note-input" key={key}>
              <label>{circles[key].title}</label>
              <small>{circles[key].hint}</small>
              <div><input value={drafts[key]} placeholder="메모 추가..." onChange={(event) => setDrafts({ ...drafts, [key]: event.target.value })} onKeyDown={(event) => event.key === "Enter" && addNote(key)} /><button onClick={() => addNote(key)}><Icon name="plus" /></button></div>
            </div>
          ))}
          <div className="mindmap-settings">
            <span className="panel-label">CUSTOMIZE SELECTED CIRCLE</span>
            <label>이름<input value={circles[selectedCircle].title} onChange={(event) => updateCircle(selectedCircle, { title: event.target.value })} /></label>
            <label>설명<input value={circles[selectedCircle].hint} onChange={(event) => updateCircle(selectedCircle, { hint: event.target.value })} /></label>
            <div><label>색상<input type="color" value={circles[selectedCircle].color} onChange={(event) => updateCircle(selectedCircle, { color: event.target.value })} /></label><label>크기<input type="range" min="270" max="430" value={circles[selectedCircle].size} onChange={(event) => updateCircle(selectedCircle, { size: Number(event.target.value) })} /></label></div>
          </div>
          <div className="business-models">
            <span className="panel-label">RECOMMENDED MVP MODELS</span>
            {suggestions.map((suggestion, index) => (
              <button className={selectedModel === index ? "active" : ""} key={suggestion.name} onClick={() => { setSelectedModel(index); setCustomIdea(""); }}>
                <b>{index + 1}. {suggestion.name}</b>
                <span>{suggestion.fit}</span>
                <small><strong>수익:</strong> {suggestion.revenue}</small>
                <small><strong>첫 검증:</strong> {suggestion.test}</small>
              </button>
            ))}
          </div>
          <div className="map-tip"><Icon name="spark" /><p><b>추천 기준</b>세 원의 메모에서 반복되는 활동, 고객 문제, 전달 방식을 일반적인 초기 MVP 모델과 연결했습니다.</p></div>
        </aside>
      </div>
    </div>
  );
}

export function Studio({ answers, onHome, onAccount, initialTab = "strategy", onNavigate, onPublish, onAnalyze }: { answers: Answers; onHome: () => void; onAccount: () => void; initialTab?: StudioTab; onNavigate?: (tab: StudioTab) => void; onPublish?: () => void; onAnalyze?: () => void }) {
  const [tab, setTab] = useState<StudioTab>(initialTab);
  const [previewMode, setPreviewMode] = useState(false);
  const [coachOpen, setCoachOpen] = useState(true);
  const [coachInput, setCoachInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "비즈니스 모델부터 MVP 실행까지 함께 설계해볼게요. 지금은 첫 고객과 핵심 약속, 수익 모델을 더 선명하게 만드는 게 좋아 보여요." },
  ]);
  const [email, setEmail] = useState("");
  const [previewEmail, setPreviewEmail] = useState("");
  const [previewLeadStatus, setPreviewLeadStatus] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [coachSending, setCoachSending] = useState(false);
  const [coachWidth, setCoachWidth] = useState(360);
  const coachResize = useRef<{ startX: number; startWidth: number } | null>(null);
  const [leads, setLeads] = useState([
    { email: "mina@example.com", source: "Landing page", date: "2026.06.09" },
    { email: "hello@studio.co", source: "Preview", date: "2026.06.08" },
    { email: "founder@new.io", source: "Landing page", date: "2026.06.07" },
  ]);
  const [notes, setNotes] = useState<Record<CircleKey, string[]>>({
    skills: ["복잡한 것 설명하기", "빠르게 구조화하기"],
    love: ["새 아이디어", "사람과 대화하기"],
    market: ["쉬운 사업 검증", "빠른 랜딩페이지"],
  });
  const [sections, setSections] = useState<Section[]>([
    { id: "hero", label: "HERO", title: answers.idea || "아이디어를 7일 안에 검증 가능한 MVP로.", body: answers.problem || "막연한 생각을 실행 가능한 계획으로 바꾸고 첫 고객의 신호를 모으세요.", tone: "light", ctaLabel: "얼리 액세스 신청" },
    { id: "problem", label: "THE PROBLEM", title: "좋은 아이디어가 실행되지 못하는 이유", body: answers.customer ? `${answers.customer}은 무엇부터 만들고 검증해야 하는지 몰라 시간을 낭비합니다.` : "무엇부터 만들고 검증해야 하는지 몰라 시작이 늦어집니다.", tone: "soft" },
    { id: "solution", label: "THE SOLUTION", title: "질문에 답하면, 가장 작은 시작이 보입니다.", body: "아이디어 정리, MVP 전략, 랜딩페이지, 리드와 이메일까지 하나의 흐름으로 연결합니다.", tone: "dark" },
  ]);
  const [selected, setSelected] = useState("hero");
  const [landingReady, setLandingReady] = useState(false);
  const [emailSequence, setEmailSequence] = useState<EmailSequenceItem[]>([
    { id: "welcome", delay: "즉시", subject: "환영합니다 - 이제 아이디어를 작게 시작해볼까요?", preview: "가입 감사와 첫 번째 작은 행동 안내", body: "가입해 주셔서 감사합니다. 오늘은 가장 중요한 고객 한 사람만 정해보세요." },
    { id: "focus", delay: "2일 후", subject: "좋은 MVP는 무엇을 빼느냐에서 시작합니다", preview: "핵심 문제에 집중하는 짧은 가이드", body: "첫 버전에서는 고객의 가장 시급한 문제 하나만 해결하세요." },
    { id: "launch", delay: "4일 후", subject: "첫 고객에게 보여주기 전 확인할 세 가지", preview: "출시 전 체크리스트와 페이지 링크", body: "누구를 위한 것인지, 어떤 결과를 주는지, 다음 행동이 무엇인지 확인하세요." },
    { id: "signal", delay: "7일 후", subject: "이번 주, 어떤 신호를 발견했나요?", preview: "답장을 유도하는 개인적인 후속 질문", body: "가장 많이 들은 반응을 답장으로 알려주세요." },
  ]);
  const [selectedEmailId, setSelectedEmailId] = useState("welcome");
  const [draggedEmailId, setDraggedEmailId] = useState<string | null>(null);
  const [emailSequenceActive, setEmailSequenceActive] = useState(false);
  const [emailSequenceReady, setEmailSequenceReady] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState("");

  const [strategy, setStrategy] = useState(() => ({
    customer: answers.customer || "첫 제품을 준비하는 비개발자 1인 창업자",
    pain: answers.problem || "아이디어는 있지만 무엇부터 검증해야 할지 몰라 시작하지 못함",
    mvp: answers.validation === "상담 예약 받기" ? "Concierge MVP" : "Landing Page MVP",
    offer: answers.idea || "질문에 답하면 10분 안에 MVP 전략과 출시 페이지를 만들어주는 서비스",
  }));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const landingRaw = window.localStorage.getItem(LANDING_STORAGE_KEY);
        if (landingRaw) {
          const landing = JSON.parse(landingRaw) as { sections?: Section[] };
          if (landing.sections?.length) {
            setSections(landing.sections.map((section) => ({ ...section, tone: section.tone || "light" })));
            setSelected(landing.sections[0].id);
            setLandingReady(true);
            return;
          }
        }
        const saved = window.localStorage.getItem("minimumtostart.canvas");
        if (saved) {
          const canvas = JSON.parse(saved) as typeof strategy;
          setStrategy(canvas);
          setSections((current) => current.map((section) => {
            if (section.id === "hero") return { ...section, title: canvas.offer, body: `${canvas.customer}을 위한 가장 작은 시작을 제안합니다.` };
            if (section.id === "problem") return { ...section, title: canvas.pain, body: `${canvas.customer}이 겪는 가장 시급한 문제에 집중합니다.` };
            if (section.id === "solution") return { ...section, title: `${canvas.mvp}로 먼저 검증하세요.`, body: canvas.offer };
            return section;
          }));
        }
        const generatedRaw = window.localStorage.getItem("minimumtostart.generated");
        if (generatedRaw) {
          const generated = JSON.parse(generatedRaw) as {
            headline?: string;
            subheadline?: string;
            emails?: { delay: string; subject: string; preview: string; body: string }[];
          };
          setSections((current) => current.map((section) =>
            section.id === "hero"
              ? { ...section, title: generated.headline || section.title, body: generated.subheadline || section.body }
              : section,
          ));
          if (generated.emails?.length) {
            const generatedEmails = generated.emails.map((item, index) => ({
              id: `generated-${index}`,
              ...item,
            }));
            setEmailSequence(generatedEmails);
            setSelectedEmailId(generatedEmails[0].id);
          }
        }
      } catch {
        // Keep the generated defaults when saved project data is unavailable.
      } finally {
        setLandingReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!landingReady) return;
    window.localStorage.setItem(LANDING_STORAGE_KEY, JSON.stringify({ sections }));
  }, [landingReady, sections]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(EMAIL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as {
            active?: boolean;
            items?: EmailSequenceItem[];
          };
          if (parsed.items?.length) {
            setEmailSequence(parsed.items);
            setSelectedEmailId(parsed.items[0].id);
          }
          setEmailSequenceActive(Boolean(parsed.active));
        } else {
          const generatedRaw = window.localStorage.getItem("minimumtostart.generated");
          if (generatedRaw) {
            const generated = JSON.parse(generatedRaw) as {
              emails?: { delay: string; subject: string; preview: string; body: string }[];
            };
            if (generated.emails?.length) {
              const generatedEmails = generated.emails.map((item, index) => ({
                id: `generated-${index}`,
                ...item,
              }));
              setEmailSequence(generatedEmails);
              setSelectedEmailId(generatedEmails[0].id);
            }
          }
        }
      } catch {
        // Keep the default sequence when saved email data is unavailable.
      } finally {
        setEmailSequenceReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!emailSequenceReady) return;
    window.localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify({
      active: emailSequenceActive,
      items: emailSequence,
    }));
  }, [emailSequence, emailSequenceActive, emailSequenceReady]);

  function updateStrategy(field: keyof typeof strategy, value: string) {
    const next = { ...strategy, [field]: value };
    setStrategy(next);
    window.localStorage.setItem("minimumtostart.canvas", JSON.stringify(next));
  }

  function goTo(nextTab: StudioTab) {
    setTab(nextTab);
    onNavigate?.(nextTab);
  }

  function updateSection(changes: Partial<Section>) {
    setSections((current) => current.map((section) => section.id === selected ? { ...section, ...changes } : section));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  }

  function addSection() {
    const id = createId("section");
    setSections((current) => [...current, {
      id,
      label: "NEW SECTION",
      title: "새로운 섹션 제목",
      body: "고객이 알아야 할 내용을 여기에 적어보세요.",
      tone: "light",
      ctaLabel: "자세히 알아보기",
    }]);
    setSelected(id);
  }

  function duplicateSection(section: Section) {
    const id = createId("section");
    const index = sections.findIndex((item) => item.id === section.id);
    const next = [...sections];
    next.splice(index + 1, 0, { ...section, id, label: `${section.label} COPY` });
    setSections(next);
    setSelected(id);
  }

  function deleteSection(id: string) {
    if (sections.length === 1) return;
    const index = sections.findIndex((section) => section.id === id);
    const next = sections.filter((section) => section.id !== id);
    setSections(next);
    if (selected === id) setSelected(next[Math.max(0, index - 1)].id);
  }

  function updateEmail(id: string, changes: Partial<EmailSequenceItem>) {
    setEmailSequence((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  function moveEmail(id: string, direction: -1 | 1) {
    setEmailSequence((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function dropEmail(targetId: string) {
    if (!draggedEmailId || draggedEmailId === targetId) return;
    setEmailSequence((current) => {
      const from = current.findIndex((item) => item.id === draggedEmailId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedEmailId(null);
  }

  function addEmail() {
    const item: EmailSequenceItem = {
      id: createId("email"),
      delay: `${emailSequence.length * 2 + 1}일 후`,
      subject: "새 이메일 제목",
      preview: "받은 편지함에 보일 짧은 설명",
      body: "이곳에 고객에게 전할 메시지를 작성하세요.",
    };
    setEmailSequence((current) => [...current, item]);
    setSelectedEmailId(item.id);
  }

  function deleteEmail(id: string) {
    if (emailSequence.length === 1) return;
    const index = emailSequence.findIndex((item) => item.id === id);
    const next = emailSequence.filter((item) => item.id !== id);
    setEmailSequence(next);
    setSelectedEmailId(next[Math.max(0, index - 1)].id);
  }

  async function addLead(candidate = email, source = "Dashboard") {
    if (!candidate.includes("@")) {
      if (source === "Preview") setPreviewLeadStatus("올바른 이메일 주소를 입력하세요.");
      else setLeadStatus("올바른 이메일 주소를 입력하세요.");
      return;
    }
    if (source === "Preview") setPreviewLeadStatus("신청 중...");
    else setLeadStatus("저장 중...");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: candidate,
          projectId: window.localStorage.getItem("minimumtostart.projectId"),
          source,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "리드 저장에 실패했습니다.");
      setLeads((current) => [{ email: candidate, source, date: new Date().toLocaleDateString("ko-KR") }, ...current]);
      const success = result.emailSent ? "저장 및 환영 이메일 발송 완료" : "리드 저장 완료";
      if (source === "Preview") {
        setPreviewLeadStatus(success);
        setPreviewEmail("");
      } else {
        setLeadStatus(success);
        setEmail("");
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "리드 저장에 실패했습니다.";
      if (source === "Preview") setPreviewLeadStatus(message);
      else setLeadStatus(message);
    }
  }

  function exportCsv() {
    const csv = ["email,source,date", ...leads.map((lead) => `${lead.email},${lead.source},${lead.date}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "minimumtostart-leads.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function sendCoach() {
    if (!coachInput.trim()) return;
    const request = coachInput.trim();
    const history = messages;
    setCoachInput("");
    setMessages([...history, { role: "user", content: request }]);
    setCoachSending(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: request, history, context: { answers, strategy, tab } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI 코치 응답에 실패했습니다.");
      setMessages((current) => [...current, { role: "assistant", content: result.reply }]);
    } catch (requestError) {
      setMessages((current) => [...current, { role: "assistant", content: requestError instanceof Error ? requestError.message : "AI 코치 응답에 실패했습니다." }]);
    } finally {
      setCoachSending(false);
    }
  }

  function startCoachResize(event: React.MouseEvent) {
    event.preventDefault();
    coachResize.current = { startX: event.clientX, startWidth: coachWidth };
    function onMove(moveEvent: MouseEvent) {
      if (!coachResize.current) return;
      // Panel is on the right edge: dragging the handle left (smaller clientX) widens it.
      const delta = coachResize.current.startX - moveEvent.clientX;
      const next = Math.min(640, Math.max(300, coachResize.current.startWidth + delta));
      setCoachWidth(next);
    }
    function onUp() {
      coachResize.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  async function sendTestEmail(subject: string, body: string) {
    const recipient = email || leads[0]?.email;
    if (!recipient) {
      setEmailSendStatus("리드 화면에서 받을 이메일을 먼저 추가해 주세요.");
      return;
    }
    setEmailSendStatus("발송 중...");
    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: recipient, subject, body }),
    });
    const result = await response.json();
    setEmailSendStatus(response.ok ? `${recipient}로 발송했습니다.` : result.error || "이메일 발송에 실패했습니다.");
  }

  return (
    <main className="studio">
      <header className="studio-header">
        <Brand />
        <div className="project-name"><span>PROJECT</span><b>My first MVP</b><i>저장됨</i></div>
        <div className="studio-actions"><button className="button button-ghost button-small" onClick={onAccount}>Account</button><button className="icon-button" aria-label="랜딩페이지 미리보기" onClick={() => { goTo("landing"); setPreviewMode(true); }}><Icon name="eye" /></button><button className="button button-dark button-small" onClick={onPublish}>페이지 공개 <Icon name="arrow" size={15} /></button></div>
      </header>
      <div className="studio-body">
        <aside className="studio-sidebar">
          <div className="sidebar-head"><span>WORKSPACE</span><button><Icon name="plus" size={16} /></button></div>
          <nav>
            {navTabs.map((item) => <button className={tab === item.id ? "active" : ""} key={item.id} onClick={() => goTo(item.id)}><i>{item.short}</i>{item.label}<Icon name="chevron" size={14} /></button>)}
          </nav>
          <div className="sidebar-bottom">
            <div className="lead-meter"><span><b>3</b> / 25 leads</span><i><em style={{ width: "12%" }} /></i><small>Free plan</small></div>
            <button onClick={onHome}>홈으로 돌아가기</button>
          </div>
        </aside>

        <section className="studio-main">
          {tab === "strategy" && (
            <CanvasBoard answers={answers} strategy={strategy} onStrategyChange={updateStrategy} onNext={() => goTo("landing")} />
          )}

          {tab === "landing" && (
            <div className={`landing-editor ${previewMode ? "preview-mode" : ""}`}>
              <div className="editor-toolbar"><div><span className="canvas-kicker">{previewMode ? "LANDING PAGE PREVIEW" : "LANDING PAGE CANVAS"}</span><b>Desktop</b></div><div>{previewMode ? <button onClick={() => setPreviewMode(false)}><Icon name="edit" /> 편집으로 돌아가기</button> : <><button onClick={addSection}><Icon name="plus" /> 섹션 추가</button><button onClick={() => setPreviewMode(true)}><Icon name="eye" /> 미리보기</button><button onClick={() => setCoachOpen(!coachOpen)}><Icon name="spark" /> AI와 수정</button></>}</div></div>
              <div className="editor-area">
                <div className="page-canvas">
                  <header><Brand /><nav><span>문제</span><span>해결 방법</span><span>FAQ</span></nav><button>시작하기</button></header>
                  {sections.map((section, index) => (
                    <section className={`editable-section section-tone-${section.tone} ${selected === section.id && !previewMode ? "selected" : ""}`} key={section.id} onClick={() => !previewMode && setSelected(section.id)}>
                      {!previewMode && <div className="section-controls"><button title="위로 이동" disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveSection(index, -1); }}>↑</button><button title="아래로 이동" disabled={index === sections.length - 1} onClick={(event) => { event.stopPropagation(); moveSection(index, 1); }}>↓</button><button title="복제" onClick={(event) => { event.stopPropagation(); duplicateSection(section); }}><Icon name="copy" size={12} /></button><button title="삭제" disabled={sections.length === 1} onClick={(event) => { event.stopPropagation(); deleteSection(section.id); }}><Icon name="trash" size={12} /></button></div>}
                      <small>{section.label}</small><h2>{section.title}</h2><p>{section.body}</p>
                      {section.ctaLabel && (
                        <>
                          <form className="mock-form" onSubmit={(event) => { event.preventDefault(); addLead(previewEmail, "Preview"); }}>
                            <input type="email" value={previewEmail} placeholder="이메일 주소" onChange={(event) => setPreviewEmail(event.target.value)} />
                            <button type="submit">{section.ctaLabel}</button>
                          </form>
                          {previewLeadStatus && <small className="mock-form-status">{previewLeadStatus}</small>}
                        </>
                      )}
                    </section>
                  ))}
                </div>
                {!previewMode && <aside className="property-panel">
                  <span className="panel-label">SELECTED BLOCK</span>
                  <label>섹션 라벨<input value={sections.find((section) => section.id === selected)?.label || ""} onChange={(event) => updateSection({ label: event.target.value })} /></label>
                  <label>제목<textarea value={sections.find((section) => section.id === selected)?.title || ""} onChange={(event) => updateSection({ title: event.target.value })} /></label>
                  <label>설명<textarea value={sections.find((section) => section.id === selected)?.body || ""} onChange={(event) => updateSection({ body: event.target.value })} /></label>
                  <label>배경 스타일<select value={sections.find((section) => section.id === selected)?.tone || "light"} onChange={(event) => updateSection({ tone: event.target.value as Section["tone"] })}><option value="light">밝게</option><option value="soft">부드럽게</option><option value="dark">어둡게</option></select></label>
                  <label>버튼 문구<input value={sections.find((section) => section.id === selected)?.ctaLabel || ""} placeholder="비우면 버튼 숨김" onChange={(event) => updateSection({ ctaLabel: event.target.value })} /></label>
                  <button className="ai-rewrite" onClick={() => updateSection({ title: "더 빠르게 검증하고, 확신 있게 시작하세요." })}><Icon name="spark" /> AI로 더 선명하게</button>
                </aside>}
              </div>
            </div>
          )}

          {tab === "mindmap" && <MindMap notes={notes} setNotes={setNotes} onUseIdea={(idea, model) => {
            const skills = notes.skills.map((note) => note.trim()).filter(Boolean);
            const loves = notes.love.map((note) => note.trim()).filter(Boolean);
            const market = notes.market.map((note) => note.trim()).filter(Boolean);
            const mindMapDetail = [
              skills.length ? `잘하는 것: ${skills.join(", ")}` : "",
              loves.length ? `좋아하는 것: ${loves.join(", ")}` : "",
              market.length ? `시장이 원하는 것: ${market.join(", ")}` : "",
            ].filter(Boolean).join(" / ");

            saveAnswers({
              ...answers,
              type: answers.type || model,
              idea: mindMapDetail ? `${idea} (${mindMapDetail})` : idea,
              problem: answers.problem || (market.length ? market.join(", ") : answers.problem),
            });
            onAnalyze?.();
          }} />}

          {tab === "leads" && (
            <div className="data-page">
              <div className="canvas-header"><div><span className="canvas-kicker">AUDIENCE SIGNALS</span><h1>첫 고객의 신호</h1><p>랜딩페이지에서 모인 리드를 확인하고 다음 대화를 시작하세요.</p></div><button className="button button-ghost" onClick={exportCsv}><Icon name="download" /> CSV 내보내기</button></div>
              <div className="stats-row"><article><span>TOTAL LEADS</span><b>{leads.length}</b><small>이번 주 +2</small></article><article><span>CONVERSION</span><b>12.4%</b><small>방문 24명</small></article><article><span>TOP SOURCE</span><b>Landing</b><small>전체의 67%</small></article></div>
              <div className="lead-entry"><input value={email} placeholder="새 리드 이메일 추가" onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addLead()} /><button onClick={() => addLead()}><Icon name="plus" /> 추가</button></div>
              {leadStatus && <p className="integration-status">{leadStatus}</p>}
              <div className="lead-table"><div className="table-row table-head"><span>EMAIL</span><span>SOURCE</span><span>DATE</span><span>STATUS</span></div>{leads.map((lead) => <div className="table-row" key={`${lead.email}-${lead.date}`}><b>{lead.email}</b><span>{lead.source}</span><span>{lead.date}</span><em>New</em></div>)}</div>
            </div>
          )}

          {tab === "emails" && (
            <div className="email-page">
              <div className="canvas-header">
                <div><span className="canvas-kicker">FOLLOW-UP SEQUENCE</span><h1>관심을 대화로 바꾸세요.</h1><p>순서를 정하고, 발송 시점과 메시지를 직접 편집하세요.</p></div>
                <button className={`button ${emailSequenceActive ? "button-ghost" : "button-dark"}`} onClick={() => setEmailSequenceActive((active) => !active)}>
                  {emailSequenceActive ? "시퀀스 일시정지" : "시퀀스 활성화"} <Icon name={emailSequenceActive ? "check" : "arrow"} />
                </button>
              </div>
              <div className="email-status-bar">
                <span className={emailSequenceActive ? "active" : ""}>{emailSequenceActive ? "ACTIVE" : "DRAFT"}</span>
                <p>{emailSequence.length}개 이메일 · 변경 사항 자동 저장</p>
                <button onClick={addEmail}><Icon name="plus" size={15} /> 이메일 추가</button>
              </div>
              <div className="email-workspace">
                <div className="sequence">
                  {emailSequence.map((item, index) => (
                    <article
                      className={selectedEmailId === item.id ? "selected" : ""}
                      draggable
                      key={item.id}
                      onClick={() => setSelectedEmailId(item.id)}
                      onDragStart={() => setDraggedEmailId(item.id)}
                      onDragEnd={() => setDraggedEmailId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropEmail(item.id)}
                    >
                      <div className="sequence-handle" aria-hidden="true">⠿</div>
                      <div className="sequence-num">{String(index + 1).padStart(2, "0")}</div>
                      <div className="sequence-summary"><span>{item.delay}</span><h3>{item.subject}</h3><p>{item.preview}</p></div>
                      <div className="sequence-actions">
                        <button aria-label="위로 이동" disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveEmail(item.id, -1); }}>↑</button>
                        <button aria-label="아래로 이동" disabled={index === emailSequence.length - 1} onClick={(event) => { event.stopPropagation(); moveEmail(item.id, 1); }}>↓</button>
                      </div>
                    </article>
                  ))}
                </div>
                {emailSequence.filter((item) => item.id === selectedEmailId).map((item) => (
                  <aside className="email-editor" key={item.id}>
                    <div className="email-editor-head">
                      <div><span>EMAIL {String(emailSequence.findIndex((emailItem) => emailItem.id === item.id) + 1).padStart(2, "0")}</span><h2>메시지 편집</h2></div>
                      <button aria-label="이메일 삭제" disabled={emailSequence.length === 1} onClick={() => deleteEmail(item.id)}><Icon name="trash" size={16} /></button>
                    </div>
                    <label>발송 시점<input value={item.delay} onChange={(event) => updateEmail(item.id, { delay: event.target.value })} placeholder="예: 2일 후" /></label>
                    <label>제목<input value={item.subject} onChange={(event) => updateEmail(item.id, { subject: event.target.value })} /></label>
                    <label>프리헤더<input value={item.preview} onChange={(event) => updateEmail(item.id, { preview: event.target.value })} /></label>
                    <label>본문<textarea value={item.body} onChange={(event) => updateEmail(item.id, { body: event.target.value })} /></label>
                    <div className="email-editor-footer">
                      <small>{item.body.length}자</small>
                      <button onClick={() => sendTestEmail(item.subject, item.body)}><Icon name="send" size={15} /> 테스트 발송</button>
                    </div>
                  </aside>
                ))}
              </div>
              {emailSendStatus && <p className="integration-status">{emailSendStatus}</p>}
            </div>
          )}
        </section>

        {coachOpen && (
          <aside className="coach-panel" style={{ width: coachWidth }}>
            <div className="coach-resize" onMouseDown={startCoachResize} title="좌우로 드래그해 크기 조절" />
            <div className="coach-head"><div><i><Icon name="spark" /></i><span><b>Launch Pilot</b><small>비즈니스 모델부터 MVP 실행까지 함께 설계해요</small></span></div><button onClick={() => setCoachOpen(false)}>×</button></div>
            <div className="coach-context"><span>지금 보고 있는 화면</span><b>{navTabs.find((item) => item.id === tab)?.label}</b></div>
            <div className="coach-messages">
              <div className="coach-intro"><Icon name="spark" /><h3>어떤 비즈니스 모델을<br />함께 설계해볼까요?</h3></div>
              {messages.map((message, index) => <p className={`coach-msg coach-msg-${message.role}`} key={`${message.role}-${index}`}>{renderRich(message.content)}</p>)}
              {coachSending && <p className="coach-msg coach-msg-assistant coach-msg-typing">검색하고 생각하는 중…</p>}
              <div className="quick-prompts"><button onClick={() => setCoachInput("더 구체적으로 써줘")}>더 구체적으로</button><button onClick={() => setCoachInput("초보자에게 쉽게 바꿔줘")}>더 쉽게 설명해줘</button><button onClick={() => setCoachInput("다른 방향 3개 제안해줘")}>다른 방향 제안</button></div>
            </div>
            <div className="coach-input"><textarea value={coachInput} placeholder={coachSending ? "AI 코치가 생각하고 있어요..." : "AI 코치와 의논하세요..."} disabled={coachSending} onChange={(event) => setCoachInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendCoach(); } }} /><button onClick={sendCoach} disabled={coachSending}><Icon name="send" /></button></div>
          </aside>
        )}
      </div>
    </main>
  );
}
