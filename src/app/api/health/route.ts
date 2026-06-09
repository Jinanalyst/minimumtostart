import { NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    services: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      supabaseUrl: Boolean(getSupabaseUrl()),
      supabasePublic: Boolean(getSupabasePublishableKey()),
      supabaseServer: Boolean(getSupabaseSecretKey()),
      resend: Boolean(process.env.RESEND_API_KEY),
      resendSender: Boolean(process.env.RESEND_FROM_EMAIL),
    },
  });
}
