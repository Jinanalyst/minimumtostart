import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/env";
import { getResend, getSupabaseAdmin } from "@/lib/server-clients";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { email, projectId, source = "Landing page" } = (await request.json()) as {
    email?: string;
    projectId?: string | null;
    source?: string;
  };

  if (!email || !emailPattern.test(email)) {
    return NextResponse.json({ error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase 연결이 설정되지 않았습니다." }, { status: 503 });

  const { data, error } = await supabase
    .from("leads")
    .upsert(
      { email: email.toLowerCase(), project_id: projectId || null, source },
      { onConflict: "project_id,email" },
    )
    .select("id,email,source,created_at")
    .single();

  if (error) {
    console.error("Lead insert failed", error);
    return NextResponse.json({ error: "리드를 저장하지 못했습니다. Supabase 테이블을 확인해 주세요." }, { status: 500 });
  }

  let emailSent = false;
  const resend = getResend();
  if (resend) {
    const { error: resendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "minimumtostart <onboarding@resend.dev>",
      to: email,
      subject: "환영합니다 — 아이디어를 가장 작은 MVP로 시작해볼까요?",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:40px 20px;color:#1b1a18"><p style="color:#ef6a42;font-size:12px;letter-spacing:1px">MINIMUMTOSTART</p><h1 style="font-size:28px">첫 번째 작은 시작이 준비됐어요.</h1><p style="line-height:1.7;color:#6e6961">관심을 남겨주셔서 감사합니다. 좋은 MVP는 완벽한 제품이 아니라 고객의 반응을 확인할 수 있는 가장 작은 실험입니다.</p><p><a href="${getSiteUrl()}" style="display:inline-block;background:#ef6a42;color:white;text-decoration:none;padding:13px 20px">MVP 계속 만들기</a></p></div>`,
    });
    if (resendError) console.error("Welcome email failed", resendError);
    emailSent = !resendError;
  }

  return NextResponse.json({ lead: data, emailSent });
}
