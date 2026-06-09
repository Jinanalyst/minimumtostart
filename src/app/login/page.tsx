"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("Supabase 공개 환경 변수를 확인해 주세요.");
      return;
    }
    setStatus("처리 중...");
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setStatus(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setStatus("확인 이메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.");
      return;
    }
    router.push("/canvas");
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <span className="canvas-kicker">MINIMUMTOSTART ACCOUNT</span>
        <h1>{mode === "login" ? "다시 만나서 반가워요." : "아이디어를 저장할 계정을 만드세요."}</h1>
        <p>프로젝트, 리드, 이메일 시퀀스를 안전하게 이어서 관리합니다.</p>
        <label>이메일<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>비밀번호<input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="button button-accent" type="submit">{mode === "login" ? "로그인" : "회원가입"}</button>
        {status && <div className="login-status">{status}</div>}
        <button className="login-switch" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인"}
        </button>
      </form>
    </main>
  );
}
