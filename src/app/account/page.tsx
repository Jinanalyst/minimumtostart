"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { bindWorkspaceToAccount } from "@/lib/workspace-session";

type AccountProfile = {
  account_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState("Loading your account...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.replace("/login?next=/account");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/login?next=/account");
        return;
      }
      bindWorkspaceToAccount(userData.user.id);

      const { data, error } = await supabase
        .from("account_profiles")
        .select("account_id, email, full_name, avatar_url")
        .eq("user_id", userData.user.id)
        .single();

      if (!active) return;
      if (error) {
        setStatus(error.message);
        return;
      }

      setProfile(data);
      setFullName(data.full_name ?? "");
      setStatus("");
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [router]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSaving(true);
    setStatus("");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() || null },
    });

    setSaving(false);
    if (error) {
      setStatus(error.message);
      return;
    }

    setProfile((current) => current ? { ...current, full_name: fullName.trim() || null } : current);
    setStatus("Profile updated.");
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="account-page">
      <section className="account-shell">
        <header className="account-header">
          <Link className="login-brand account-brand" href="/canvas">
            <span className="brand-mark" aria-hidden="true"><i /></span>
            minimumtostart
          </Link>
          <Link className="button button-ghost button-small" href="/canvas">Back to workspace</Link>
        </header>

        <div className="account-content">
          <div className="account-intro">
            <span className="canvas-kicker">YOUR ACCOUNT</span>
            <h1>Make this workspace yours.</h1>
            <p>Update the name attached to your account or return to your project whenever you are ready.</p>
          </div>

          <form className="account-card" onSubmit={saveProfile}>
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="account-avatar" src={profile.avatar_url} alt="" />
            ) : (
              <div className="account-avatar account-avatar-fallback" aria-hidden="true">
                {(fullName || profile?.email || "M").charAt(0).toUpperCase()}
              </div>
            )}

            <label>
              Display name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" />
            </label>
            <label>
              Email address
              <input value={profile?.email ?? ""} disabled />
            </label>
            <label>
              Account ID
              <input value={profile?.account_id ?? ""} disabled />
            </label>

            {status && <div className="login-status" role="status">{status}</div>}

            <div className="account-actions">
              <button className="button button-accent" type="submit" disabled={!profile || saving}>
                {saving ? "Saving..." : "Save profile"}
              </button>
              <button className="account-signout" type="button" onClick={signOut}>Sign out</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
