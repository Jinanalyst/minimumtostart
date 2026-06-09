"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home } from "@/components/product";

const AUTH_NEXT_PATH_KEY = "minimumtostart.authNextPath";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const requestedPath = window.localStorage.getItem(AUTH_NEXT_PATH_KEY);
      const nextPath =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : "/onboarding";
      window.localStorage.removeItem(AUTH_NEXT_PATH_KEY);
      router.replace(
        `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(nextPath)}`,
      );
    }
  }, [router]);

  return <Home onStart={() => router.push("/login?next=/onboarding")} />;
}
