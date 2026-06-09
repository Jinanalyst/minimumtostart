// Standalone check that the OpenAI key + mindmap-driven generation works.
// Mirrors src/app/api/generate/route.ts exactly, but skips Supabase auth/persistence
// so we can verify the AI call in isolation.
//
// Usage (PowerShell):
//   $env:OPENAI_API_KEY = "sk-..."
//   node scripts/verify-openai.mjs
// Optional: $env:OPENAI_MODEL = "gpt-5.4-mini"

import OpenAI from "openai";

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
};

// The same answers object the new mindmap handler builds (product.tsx),
// using the words from the screenshot's three circles.
const skills = ["복잡한 것 설명하기", "빠르게 구조화하기"];
const loves = ["새 아이디어", "사람과 대화하기"];
const market = ["쉬운 사업 검증", "빠른 랜딩페이지"];
const model = "제품화된 서비스";
const idea = `${skills[0]}을 활용해 ${market[0]}를 해결하는 ${loves[0]} 기반 ${model}`;
const mindMapDetail = [
  `잘하는 것: ${skills.join(", ")}`,
  `좋아하는 것: ${loves.join(", ")}`,
  `시장이 원하는 것: ${market.join(", ")}`,
].join(" / ");

const answers = {
  stage: "",
  type: model,
  idea: `${idea} (${mindMapDetail})`,
  customer: "",
  problem: market.join(", "),
  validation: "",
  budget: "",
};

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set. Set it and re-run.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log("Model:", process.env.OPENAI_MODEL ?? "gpt-5.4-mini");
console.log("Sending mindmap answers:\n", JSON.stringify(answers, null, 2), "\n");

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

  const project = JSON.parse(response.output_text);
  console.log("✅ OpenAI generation succeeded. Result:\n");
  console.log(JSON.stringify(project, null, 2));
} catch (error) {
  console.error("❌ OpenAI generation failed:");
  console.error(error);
  process.exit(1);
}
