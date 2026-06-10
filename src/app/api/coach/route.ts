import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/server-clients";

type ChatRole = "user" | "assistant";
type ChatTurn = { role: ChatRole; content: string };

const SYSTEM_INSTRUCTIONS = [
  "You are Minto Coach, a Korean business-model and MVP strategist.",
  "You help a solo founder go from a raw idea to a concrete business model and a testable MVP — 비즈니스 모델부터 MVP 실행까지 함께 설계해요.",
  "Focus on business-model ideation: customer segments, the core problem, the offer, revenue/pricing model, channels, and the smallest experiment to validate it.",
  "When the user asks about markets, competitors, pricing benchmarks, trends, or real examples, use the web search tool to ground your answer in current information, then cite what you found briefly.",
  "Be concrete and practical. Prefer one strong recommendation or next action over a long list.",
  "Always answer in natural Korean. Keep replies under ~150 Korean words unless the user explicitly asks for more depth.",
].join(" ");

export async function POST(request: Request) {
  const { message, history, context } = (await request.json()) as {
    message?: string;
    history?: ChatTurn[];
    context?: unknown;
  };
  if (!message?.trim()) {
    return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
  }

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json({
      reply: `“${message}” 요청을 반영해 고객, 문제, 오퍼, 수익 모델을 더 구체적인 문장으로 다듬어보세요.`,
      fallback: true,
    });
  }

  // Build a real conversation: prior turns + the current project context + the new message.
  const priorTurns = Array.isArray(history)
    ? history
        .filter((turn): turn is ChatTurn => Boolean(turn?.content?.trim()) && (turn.role === "user" || turn.role === "assistant"))
        .slice(-10)
        .map((turn) => ({ role: turn.role, content: turn.content }))
    : [];

  const input = [
    ...priorTurns,
    {
      role: "user" as const,
      content: `현재 프로젝트 정보(JSON):\n${JSON.stringify(context)}\n\n요청:\n${message}`,
    },
  ];

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      instructions: SYSTEM_INSTRUCTIONS,
      tools: [{ type: "web_search" }],
      input,
    });

    const reply = response.output_text?.trim();
    if (!reply) {
      return NextResponse.json({ error: "AI 코치가 응답을 생성하지 못했습니다. 다시 시도해 주세요." }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("coach route failed", error);
    return NextResponse.json({ error: "AI 코치 응답에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
