"use client";

import { useRouter } from "next/navigation";
import { Home } from "@/components/product";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { bindWorkspaceToAccount } from "@/lib/workspace-session";

export default function HomePage() {
  const router = useRouter();

  async function startBuilding() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      router.push("/login?next=/onboarding");
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login?next=/onboarding");
      return;
    }

    bindWorkspaceToAccount(data.user.id);
    router.push("/onboarding");
  }

  return <Home onStart={startBuilding} />;
}
