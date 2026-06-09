# minimumtostart integrations

## Vercel environment variables

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx

OPENAI_API_KEY=sk-proj-xxx
OPENAI_MODEL=gpt-5.4-mini

RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=minimumtostart <hello@your-verified-domain.com>
```

Legacy Supabase variable names are also supported:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=legacy_anon_key
SUPABASE_SERVICE_ROLE_KEY=legacy_service_role_key
```

Never add `NEXT_PUBLIC_` to OpenAI, Resend, or Supabase secret keys.

## Supabase database

Apply the SQL files below in the Supabase SQL editor in filename order:

`supabase/migrations/20260609000000_initial_mvp_schema.sql`

`supabase/migrations/20260609010000_add_account_profiles.sql`

They create the `projects`, `leads`, and `profiles` tables, enable RLS, and add
authenticated-user policies. Every Google or email account receives a stable,
separate custom account ID in the format `MTS-A1B2C3...`. The profile migration also
backfills IDs for users who registered before it was applied.

## Supabase Auth

Enable Email and Google authentication in the Supabase dashboard. Add the production URL and these redirect URLs:

```text
https://your-domain.com/**
http://localhost:3000/**
```

The application login page is available at `/login`.

For Google sign-in:

1. Create an OAuth 2.0 Web application in Google Cloud Console.
2. Add the Supabase callback URL shown under Supabase Authentication > Providers > Google
   as an authorized redirect URI. It has the form
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
3. Copy the Google client ID and client secret into the Google provider settings in Supabase.
4. Keep `http://localhost:3000/**` and the production domain in the Supabase redirect URL allow list.

## Resend

Verify the sending domain in Resend before using `RESEND_FROM_EMAIL`. Without a verified domain, use:

```env
RESEND_FROM_EMAIL=minimumtostart <onboarding@resend.dev>
```

Resend's test sender may only deliver to the email address associated with the Resend account.

## Connection check

After deployment, open:

```text
https://your-domain.com/api/health
```

Every configured service should return `true`. The endpoint only returns booleans and never exposes secret values.
