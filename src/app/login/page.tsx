"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { bindWorkspaceToAccount } from "@/lib/workspace-session";

type AuthMode = "login" | "signup";

function browserAllowsCookies() {
  try {
    const name = "minimumtostart_cookie_check";
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=1; Path=/; SameSite=Lax${secure}`;
    const allowed = document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith(`${name}=`));
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    return allowed;
  } catch {
    return false;
  }
}

function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/fetch|network|connection|load failed/i.test(message)) {
    return "The browser could not reach the login service. Check the internet connection, disable content blocking for this site, and try again.";
  }
  if (/storage|cookie/i.test(message)) {
    return "This browser is blocking the cookies needed to stay signed in. Allow cookies for minimumtostart.com and try again.";
  }
  return message;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.55l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.88-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signup");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState<"google" | "email" | null>(null);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error) queueMicrotask(() => setStatus(error));

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    async function continueExistingSession() {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (!active) return;
        if (userError) {
          setStatus(authErrorMessage(userError));
          return;
        }
        if (!data.user) return;
        bindWorkspaceToAccount(data.user.id);
        router.replace(getNextPath());
        router.refresh();
      } catch (sessionError) {
        if (active) setStatus(authErrorMessage(sessionError));
      }
    }

    continueExistingSession();

    return () => {
      active = false;
    };
  }, [router]);

  function getNextPath() {
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    return requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/onboarding";
  }

  async function continueWithGoogle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("Authentication is not configured yet. Add the Supabase environment variables.");
      return;
    }

    if (!browserAllowsCookies()) {
      setStatus(
        "This browser is blocking the cookies needed for Google sign-in. Open this page in Safari, Chrome, Edge, or Firefox and allow cookies for minimumtostart.com.",
      );
      return;
    }

    try {
      setPending("google");
      setStatus("");
      const nextPath = getNextPath();
      const redirectTo =
        `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setStatus(authErrorMessage(error));
        setPending(null);
      }
    } catch (oauthError) {
      setStatus(authErrorMessage(oauthError));
      setPending(null);
    }
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("Authentication is not configured yet. Add the Supabase environment variables.");
      return;
    }

    try {
      setPending("email");
      setStatus("");
      const nextPath = getNextPath();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo:
                  `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
              },
            });

      if (result.error) {
        setStatus(authErrorMessage(result.error));
        setPending(null);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setStatus("Check your inbox to confirm your email, then come back to sign in.");
        setPending(null);
        return;
      }

      if (result.data.user) bindWorkspaceToAccount(result.data.user.id);
      router.push(nextPath);
      router.refresh();
    } catch (emailError) {
      setStatus(authErrorMessage(emailError));
      setPending(null);
    }
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setStatus("");
  }

  const isSignup = mode === "signup";

  return (
    <main className="login-page">
      <section className="login-shell" aria-labelledby="login-title">
        <aside className="login-story">
          <Link className="login-brand" href="/" aria-label="Minimum to Start home">
            <Image className="login-brand-icon" src="/brand-icon.png" alt="" width={220} height={271} priority />
            <span>minimum to start</span>
          </Link>
          <div>
            <span className="canvas-kicker">FROM IDEA TO FIRST CUSTOMER</span>
            <h2>Build the smallest thing worth starting.</h2>
            <p>
              Turn an early idea into a focused MVP, a landing page, and a plan
              you can actually launch.
            </p>
          </div>
          <small>One workspace. No blank-page paralysis.</small>
        </aside>

        <div className="login-card">
          <span className="canvas-kicker">{isSignup ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</span>
          <h1 id="login-title">{isSignup ? "Start building today." : "Good to see you again."}</h1>
          <p>
            {isSignup
              ? "Create your free account and keep every idea, page, and lead in one place."
              : "Sign in to continue working on your ideas and projects."}
          </p>

          <button
            className="google-auth-button"
            type="button"
            onClick={continueWithGoogle}
            disabled={pending !== null}
          >
            <GoogleIcon />
            <span>{pending === "google" ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          <div className="login-divider"><span>or continue with email</span></div>

          <form className="login-form" onSubmit={submitEmail}>
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="At least 6 characters"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="button button-accent" type="submit" disabled={pending !== null}>
              {pending === "email" ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          {status && <div className="login-status" role="alert">{status}</div>}

          <button className="login-switch" type="button" onClick={switchMode}>
            {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>

          <p className="login-terms">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </section>
    </main>
  );
}
