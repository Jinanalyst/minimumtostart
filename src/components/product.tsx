"use client";

import { useEffect, useState } from "react";

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
};

type BoardCard = {
  id: keyof Answers | "mvp" | "offer";
  kicker: string;
  question: string;
  answer: string;
  x: number;
  y: number;
  color: "orange" | "green" | "yellow" | "white";
};

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
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    cursor: <path d="m5 3 14 8-6 2-3 6Z" />,
    line: <path d="M5 19 19 5" />,
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

  function updateCard(id: BoardCard["id"], answer: string) {
    setCards((current) => current.map((card) => card.id === id ? { ...card, answer } : card));
    if (id === "problem") onStrategyChange("pain", answer);
    if (id === "customer" || id === "mvp" || id === "offer") onStrategyChange(id, answer);
  }

  function startDrag(event: React.PointerEvent<HTMLElement>, card: BoardCard) {
    if (activeTool !== "cursor") return;
    const target = event.target as HTMLElement;
    if (target.closest("textarea")) return;
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
            ["line", "line", "연결선"],
            ["note", "note", "메모"],
            ["text", "text", "텍스트"],
          ].map(([id, icon, label]) => <button className={activeTool === id ? "active" : ""} key={id} title={label} onClick={() => setActiveTool(id)}><Icon name={icon} /></button>)}
          <i />
          <button title="카드 추가" onClick={() => setCards([...cards, { id: "budget", kicker: "NEW THOUGHT", question: "새로운 질문", answer: "여기에 생각을 적어보세요.", x: 150, y: 660, color: "white" }])}><Icon name="plus" /></button>
        </div>
        <div className="board-stage" style={{ transform: `scale(${zoom / 100})` }}>
          <svg className="board-lines" width="1400" height="900" viewBox="0 0 1400 900" aria-hidden="true">
            <path d="M350 180 C410 180 410 170 470 170" />
            <path d="M700 170 C750 170 760 190 810 200" />
            <path d="M580 270 C560 330 520 350 470 390" />
            <path d="M510 450 C560 450 570 450 620 450" />
            <path d="M820 460 C870 460 900 470 950 480" />
            <path d="M720 560 C710 620 680 650 650 680" />
          </svg>
          {cards.map((card) => (
            <article
              className={`board-card card-${card.color} ${dragging?.id === card.id ? "dragging" : ""}`}
              key={card.id}
              style={{ left: card.x, top: card.y }}
              onPointerDown={(event) => startDrag(event, card)}
            >
              <div className="board-card-head"><span>{card.kicker}</span><i>•••</i></div>
              <h3>{card.question}</h3>
              <textarea value={card.answer} onChange={(event) => updateCard(card.id, event.target.value)} />
              <small>클릭해서 수정 · 드래그해서 이동</small>
            </article>
          ))}
          <div className="board-summary">
            <Icon name="spark" />
            <span><b>AI가 발견한 연결</b>이 고객은 “완성된 제품”보다 “무엇을 먼저 검증할지 알려주는 명확한 시작”을 원합니다.</span>
          </div>
        </div>
        <div className="board-bottom">
          <span>{cards.length} cards</span>
          <div><button onClick={() => setZoom(Math.max(50, zoom - 10))}><Icon name="zoomOut" size={15} /></button><input type="range" min="50" max="120" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><button onClick={() => setZoom(Math.min(120, zoom + 10))}><Icon name="zoomIn" size={15} /></button><b>{zoom}%</b></div>
        </div>
      </div>
    </div>
  );
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <button className={`brand ${inverse ? "brand-inverse" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <span className="brand-mark"><i /></span>
      <span>minimumtostart</span>
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
          <h1>흩어진 아이디어를<br /><em>출시 가능한 MVP로.</em></h1>
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
  onUseIdea: (idea: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<CircleKey, string>>({ skills: "", love: "", market: "" });
  const labels: Record<CircleKey, { title: string; hint: string }> = {
    skills: { title: "잘하는 것", hint: "경험, 기술, 남들이 자주 부탁하는 것" },
    love: { title: "좋아하는 것", hint: "시간 가는 줄 모르고 하는 것" },
    market: { title: "시장이 원하는 것", hint: "사람들이 돈과 시간을 쓰는 문제" },
  };

  function addNote(key: CircleKey) {
    const value = drafts[key].trim();
    if (!value) return;
    setNotes({ ...notes, [key]: [...notes[key], value] });
    setDrafts({ ...drafts, [key]: "" });
  }

  const idea = `${notes.skills[0] || "당신의 강점"}을 활용해 ${notes.market[0] || "시장의 문제"}를 해결하는 ${notes.love[0] || "좋아하는 방식"} 기반 서비스`;

  return (
    <div className="mindmap-layout">
      <div className="mindmap-toolbar">
        <div><span className="canvas-kicker">OPPORTUNITY FINDER</span><h2>나만의 사업 기회 찾기</h2><p>세 영역에 메모를 더하고 가운데 겹치는 기회를 발견하세요.</p></div>
        <button className="button button-dark" onClick={() => onUseIdea(idea)}>이 아이디어로 MVP 만들기 <Icon name="arrow" /></button>
      </div>
      <div className="mindmap-workspace">
        <div className="venn-editor">
          <div className="edit-circle edit-skill"><b>잘하는 것</b>{notes.skills.map((note) => <span key={note}>{note}</span>)}</div>
          <div className="edit-circle edit-love"><b>좋아하는 것</b>{notes.love.map((note) => <span key={note}>{note}</span>)}</div>
          <div className="edit-circle edit-market"><b>시장이 원하는 것</b>{notes.market.map((note) => <span key={note}>{note}</span>)}</div>
          <div className="edit-center"><Icon name="spark" /><b>사업 기회</b><span>{idea}</span></div>
        </div>
        <aside className="mindmap-panel">
          <span className="panel-label">ADD YOUR THOUGHTS</span>
          {(Object.keys(labels) as CircleKey[]).map((key) => (
            <div className="note-input" key={key}>
              <label>{labels[key].title}</label>
              <small>{labels[key].hint}</small>
              <div><input value={drafts[key]} placeholder="메모 추가..." onChange={(event) => setDrafts({ ...drafts, [key]: event.target.value })} onKeyDown={(event) => event.key === "Enter" && addNote(key)} /><button onClick={() => addNote(key)}><Icon name="plus" /></button></div>
            </div>
          ))}
          <div className="map-tip"><Icon name="spark" /><p><b>AI 코치의 질문</b>세 원에 동시에 해당하는 경험이 있나요? 아주 작았던 경험도 좋은 단서예요.</p></div>
        </aside>
      </div>
    </div>
  );
}

export function Studio({ answers, onHome, onAccount, initialTab = "strategy", onNavigate, onPublish }: { answers: Answers; onHome: () => void; onAccount: () => void; initialTab?: StudioTab; onNavigate?: (tab: StudioTab) => void; onPublish?: () => void }) {
  const [tab, setTab] = useState<StudioTab>(initialTab);
  const [coachOpen, setCoachOpen] = useState(true);
  const [coachInput, setCoachInput] = useState("");
  const [messages, setMessages] = useState(["이 프로젝트를 함께 다듬어볼게요. 지금은 첫 고객과 핵심 약속을 더 선명하게 만드는 게 좋아 보여요."]);
  const [email, setEmail] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [coachSending, setCoachSending] = useState(false);
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
    { id: "hero", label: "HERO", title: answers.idea || "아이디어를 7일 안에 검증 가능한 MVP로.", body: answers.problem || "막연한 생각을 실행 가능한 계획으로 바꾸고 첫 고객의 신호를 모으세요." },
    { id: "problem", label: "THE PROBLEM", title: "좋은 아이디어가 실행되지 못하는 이유", body: answers.customer ? `${answers.customer}은 무엇부터 만들고 검증해야 하는지 몰라 시간을 낭비합니다.` : "무엇부터 만들고 검증해야 하는지 몰라 시작이 늦어집니다." },
    { id: "solution", label: "THE SOLUTION", title: "질문에 답하면, 가장 작은 시작이 보입니다.", body: "아이디어 정리, MVP 전략, 랜딩페이지, 리드와 이메일까지 하나의 흐름으로 연결합니다." },
  ]);
  const [selected, setSelected] = useState("hero");
  const [emailSequence, setEmailSequence] = useState([
    ["즉시", "환영합니다 — 이제 아이디어를 작게 시작해볼까요?", "가입 감사와 첫 번째 작은 행동 안내", "가입해 주셔서 감사합니다. 오늘은 가장 중요한 고객 한 사람만 정해보세요."],
    ["2일 후", "좋은 MVP는 무엇을 빼느냐에서 시작합니다", "핵심 문제에 집중하는 짧은 가이드", "첫 버전에서는 고객의 가장 시급한 문제 하나만 해결하세요."],
    ["4일 후", "첫 고객에게 보여주기 전 확인할 세 가지", "출시 전 체크리스트와 페이지 링크", "누구를 위한 것인지, 어떤 결과를 주는지, 다음 행동이 무엇인지 확인하세요."],
    ["7일 후", "이번 주, 어떤 신호를 발견했나요?", "답장을 유도하는 개인적인 후속 질문", "가장 많이 들은 반응을 답장으로 알려주세요."],
  ]);
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
        const saved = window.localStorage.getItem("minimumtostart.canvas");
        if (!saved) return;
        const canvas = JSON.parse(saved) as typeof strategy;
        setStrategy(canvas);
        setSections((current) => current.map((section) => {
          if (section.id === "hero") return { ...section, title: canvas.offer, body: `${canvas.customer}을 위한 가장 작은 시작을 제안합니다.` };
          if (section.id === "problem") return { ...section, title: canvas.pain, body: `${canvas.customer}이 겪는 가장 시급한 문제에 집중합니다.` };
          if (section.id === "solution") return { ...section, title: `${canvas.mvp}로 먼저 검증하세요.`, body: canvas.offer };
          return section;
        }));
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
            setEmailSequence(generated.emails.map((item) => [item.delay, item.subject, item.preview, item.body]));
          }
        }
      } catch {
        // Keep the generated defaults when saved project data is unavailable.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function updateStrategy(field: keyof typeof strategy, value: string) {
    const next = { ...strategy, [field]: value };
    setStrategy(next);
    window.localStorage.setItem("minimumtostart.canvas", JSON.stringify(next));
  }

  function goTo(nextTab: StudioTab) {
    setTab(nextTab);
    onNavigate?.(nextTab);
  }

  function updateSection(field: "title" | "body", value: string) {
    setSections(sections.map((section) => section.id === selected ? { ...section, [field]: value } : section));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  }

  async function addLead() {
    if (!email.includes("@")) return;
    setLeadStatus("저장 중...");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          projectId: window.localStorage.getItem("minimumtostart.projectId"),
          source: "Dashboard",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "리드 저장에 실패했습니다.");
      setLeads([{ email, source: "Dashboard", date: new Date().toLocaleDateString("ko-KR") }, ...leads]);
      setLeadStatus(result.emailSent ? "저장 및 환영 이메일 발송 완료" : "리드 저장 완료");
      setEmail("");
    } catch (requestError) {
      setLeadStatus(requestError instanceof Error ? requestError.message : "리드 저장에 실패했습니다.");
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
    setCoachInput("");
    setCoachSending(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: request, context: { answers, strategy, tab } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI 코치 응답에 실패했습니다.");
      setMessages([...messages, result.reply]);
    } catch (requestError) {
      setMessages([...messages, requestError instanceof Error ? requestError.message : "AI 코치 응답에 실패했습니다."]);
    } finally {
      setCoachSending(false);
    }
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
        <div className="studio-actions"><button className="button button-ghost button-small" onClick={onAccount}>Account</button><button className="icon-button" aria-label="미리보기"><Icon name="edit" /></button><button className="button button-dark button-small" onClick={onPublish}>페이지 공개 <Icon name="arrow" size={15} /></button></div>
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
            <div className="landing-editor">
              <div className="editor-toolbar"><div><span className="canvas-kicker">LANDING PAGE CANVAS</span><b>Desktop</b></div><div><button><Icon name="plus" /> 섹션 추가</button><button onClick={() => setCoachOpen(!coachOpen)}><Icon name="spark" /> AI와 수정</button></div></div>
              <div className="editor-area">
                <div className="page-canvas">
                  <header><Brand /><nav><span>문제</span><span>해결 방법</span><span>FAQ</span></nav><button>시작하기</button></header>
                  {sections.map((section, index) => (
                    <section className={`editable-section section-${section.id} ${selected === section.id ? "selected" : ""}`} key={section.id} onClick={() => setSelected(section.id)}>
                      <div className="section-controls"><button onClick={(event) => { event.stopPropagation(); moveSection(index, -1); }}>↑</button><button onClick={(event) => { event.stopPropagation(); moveSection(index, 1); }}>↓</button></div>
                      <small>{section.label}</small><h2>{section.title}</h2><p>{section.body}</p>
                      {section.id === "hero" && <div className="mock-form"><input placeholder="이메일 주소" /><button>얼리 액세스 신청</button></div>}
                    </section>
                  ))}
                </div>
                <aside className="property-panel">
                  <span className="panel-label">SELECTED BLOCK</span>
                  <label>제목<textarea value={sections.find((section) => section.id === selected)?.title || ""} onChange={(event) => updateSection("title", event.target.value)} /></label>
                  <label>설명<textarea value={sections.find((section) => section.id === selected)?.body || ""} onChange={(event) => updateSection("body", event.target.value)} /></label>
                  <button className="ai-rewrite" onClick={() => updateSection("title", "더 빠르게 검증하고, 확신 있게 시작하세요.")}><Icon name="spark" /> AI로 더 선명하게</button>
                </aside>
              </div>
            </div>
          )}

          {tab === "mindmap" && <MindMap notes={notes} setNotes={setNotes} onUseIdea={(idea) => { setSections(sections.map((section) => section.id === "hero" ? { ...section, title: idea } : section)); goTo("strategy"); }} />}

          {tab === "leads" && (
            <div className="data-page">
              <div className="canvas-header"><div><span className="canvas-kicker">AUDIENCE SIGNALS</span><h1>첫 고객의 신호</h1><p>랜딩페이지에서 모인 리드를 확인하고 다음 대화를 시작하세요.</p></div><button className="button button-ghost" onClick={exportCsv}><Icon name="download" /> CSV 내보내기</button></div>
              <div className="stats-row"><article><span>TOTAL LEADS</span><b>{leads.length}</b><small>이번 주 +2</small></article><article><span>CONVERSION</span><b>12.4%</b><small>방문 24명</small></article><article><span>TOP SOURCE</span><b>Landing</b><small>전체의 67%</small></article></div>
              <div className="lead-entry"><input value={email} placeholder="새 리드 이메일 추가" onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addLead()} /><button onClick={addLead}><Icon name="plus" /> 추가</button></div>
              {leadStatus && <p className="integration-status">{leadStatus}</p>}
              <div className="lead-table"><div className="table-row table-head"><span>EMAIL</span><span>SOURCE</span><span>DATE</span><span>STATUS</span></div>{leads.map((lead) => <div className="table-row" key={`${lead.email}-${lead.date}`}><b>{lead.email}</b><span>{lead.source}</span><span>{lead.date}</span><em>New</em></div>)}</div>
            </div>
          )}

          {tab === "emails" && (
            <div className="email-page">
              <div className="canvas-header"><div><span className="canvas-kicker">FOLLOW-UP SEQUENCE</span><h1>관심을 대화로 바꾸세요.</h1><p>가입 직후 환영 이메일과 3개의 후속 메시지가 준비되어 있습니다.</p></div><button className="button button-dark">시퀀스 활성화 <Icon name="arrow" /></button></div>
              <div className="sequence">
                {emailSequence.map(([time, title, desc, body], index) => <article key={title}><div className="sequence-num">{String(index + 1).padStart(2, "0")}</div><div><span>{time}</span><h3>{title}</h3><p>{desc}</p></div><button onClick={() => sendTestEmail(title, body)}><Icon name="send" /> 테스트 발송</button></article>)}
              </div>
              {emailSendStatus && <p className="integration-status">{emailSendStatus}</p>}
            </div>
          )}
        </section>

        {coachOpen && (
          <aside className="coach-panel">
            <div className="coach-head"><div><i><Icon name="spark" /></i><span><b>Minto Coach</b><small>프로젝트를 함께 생각해요</small></span></div><button onClick={() => setCoachOpen(false)}>×</button></div>
            <div className="coach-context"><span>지금 보고 있는 화면</span><b>{navTabs.find((item) => item.id === tab)?.label}</b></div>
            <div className="coach-messages">
              <div className="coach-intro"><Icon name="spark" /><h3>어떤 부분을 함께<br />다듬어볼까요?</h3></div>
              {messages.map((message, index) => <p key={`${message}-${index}`}>{message}</p>)}
              <div className="quick-prompts"><button onClick={() => setCoachInput("더 구체적으로 써줘")}>더 구체적으로</button><button onClick={() => setCoachInput("초보자에게 쉽게 바꿔줘")}>더 쉽게 설명해줘</button><button onClick={() => setCoachInput("다른 방향 3개 제안해줘")}>다른 방향 제안</button></div>
            </div>
            <div className="coach-input"><textarea value={coachInput} placeholder={coachSending ? "AI 코치가 생각하고 있어요..." : "AI 코치와 의논하세요..."} disabled={coachSending} onChange={(event) => setCoachInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendCoach(); } }} /><button onClick={sendCoach} disabled={coachSending}><Icon name="send" /></button></div>
          </aside>
        )}
      </div>
    </main>
  );
}
