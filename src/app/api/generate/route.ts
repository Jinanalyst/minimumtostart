import { NextResponse } from "next/server";
import type { Answers } from "@/components/product";
import { fallbackProject, type GeneratedProject } from "@/lib/generated-project";
import { getOpenAI, getSupabaseAdmin } from "@/lib/server-clients";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "customer", "pain", "mvp", "why", "offer", "headline", "subheadline", "cta", "monetization", "pricing", "launchPlan", "emails"],
  properties: {
    summary: { type: "string" },
    customer: { type: "string" },
    pain: { type: "string" },
    mvp: { type: "string" },
    why: { type: "string" },
    offer: { type: "string" },
    headline: { type: "string" },
    subheadline: { type: "string" },
    cta: { type: "string" },
    monetization: { type: "string" },
    pricing: { type: "string" },
    launchPlan: { type: "array", minItems: 5, maxItems: 7, items: { type: "string" } },
    emails: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["delay", "subject", "preview", "body"],
        properties: {
          delay: { type: "string" },
          subject: { type: "string" },
          preview: { type: "string" },
          body: { type: "string" },
        },
      },
    },
  },
} as const;

export async function POST(request: Request) {
  const answers = (await request.json()) as Answers;
  const fallback = fallbackProject(answers);
  let project = fallback;
  let generatedBy = "fallback";

  const openai = getOpenAI();
  if (openai) {
    try {
      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
        instructions:
          "You are a calm, practical Korean startup strategist. Turn interview answers into a specific, testable MVP. Write all user-facing content in Korean. Avoid hype and vague claims.",
        input: JSON.stringify(answers),
        text: {
          format: {
            type: "json_schema",
            name: "mvp_project",
            strict: true,
            schema,
          },
        },
      });
      project = JSON.parse(response.output_text) as GeneratedProject;
      generatedBy = "openai";
    } catch (error) {
      console.error("OpenAI generation failed", error);
    }
  }

  let projectId: string | null = null;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("projects")
      .insert({ answers, generated: project, title: project.summary.slice(0, 80) })
      .select("id")
      .single();
    if (error) console.error("Supabase project insert failed", error);
    projectId = data?.id ?? null;
  }

  return NextResponse.json({ project, projectId, generatedBy });
}
