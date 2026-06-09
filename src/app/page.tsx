"use client";

import { useRouter } from "next/navigation";
import { Home } from "@/components/product";

export default function HomePage() {
  const router = useRouter();
  return <Home onStart={() => router.push("/onboarding")} onMap={() => router.push("/mindmap")} />;
}
