import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");
  const requestedPath = requestUrl.searchParams.get("next");
  const nextPath =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/onboarding";
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  if (!code || !url || !key) {
    const message = oauthError
      ? oauthError
      : !code
        ? "Google sign-in was cancelled or could not be completed."
      : "Authentication is not configured.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, requestUrl.origin),
    );
  }

  const response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
    );
  }

  return response;
}
