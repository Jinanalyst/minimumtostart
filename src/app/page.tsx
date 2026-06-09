"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home } from "@/components/product";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      router.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent("/onboarding")}`);
    }
  }, [router]);

  return <Home onStart={() => router.push("/login?next=/onboarding")} />;
}
