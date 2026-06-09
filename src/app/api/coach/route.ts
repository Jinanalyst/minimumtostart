import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/server-clients";

export async function POST(request: Request) {
  const { message, context } = (await request.json()) as {
    message?: string;
    context?: unknown;
  };
  if (!message?.trim()) return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json({
      reply: `“${message}” 요청을 반영해 고객, 문제, 오퍼를 더 구체적인 문장으로 다듬어보세요.`,
      fallback: true,
    });
  }

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
    instructions:
      "You are Minto Coach, a concise Korean startup coach. Give one practical revision or next action. Stay under 120 Korean words.",
    input: `Project context:\n${JSON.stringify(context)}\n\nUser request:\n${message}`,
  });

  return NextResponse.json({ reply: response.output_text });
}
