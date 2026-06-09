import { NextResponse } from "next/server";
import { getResend } from "@/lib/server-clients";

export async function POST(request: Request) {
  const { to, subject, body } = (await request.json()) as {
    to?: string;
    subject?: string;
    body?: string;
  };
  if (!to || !subject || !body) {
    return NextResponse.json({ error: "받는 사람, 제목, 본문이 필요합니다." }, { status: 400 });
  }

  const resend = getResend();
  if (!resend) return NextResponse.json({ error: "Resend 연결이 설정되지 않았습니다." }, { status: 503 });

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "minimumtostart <onboarding@resend.dev>",
    to,
    subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:40px 20px;color:#1b1a18"><p style="color:#ef6a42;font-size:12px;letter-spacing:1px">MINIMUMTOSTART</p>${body.split("\n").map((line) => `<p style="line-height:1.7">${line}</p>`).join("")}</div>`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data?.id });
}
