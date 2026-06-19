#!/usr/bin/env node
// Guided client setup for a new Harbormill AIOS deployment.
//
// Plug-and-play onboarding: gathers the per-client basics, writes .env, and
// prints the exact ordered commands to stand up the backend. It does NOT run
// destructive Supabase CLI commands itself — you review and run those — so it's
// safe to re-run. Usage: `npm run setup:client`
//
// See docs/client-setup.md for the full reference.

import { readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });
const ask = async (q, def = "") => {
  const a = (await rl.question(def ? `${q} [${def}]: ` : `${q}: `)).trim();
  return a || def;
};
const exists = async (p) => access(p, constants.F_OK).then(() => true, () => false);

console.log("\n  Harbormill AIOS — client setup\n  ──────────────────────────────\n");

// 1. Frontend env
const url = await ask("Supabase project URL (https://<ref>.supabase.co)");
const anon = await ask("Supabase anon / publishable key");
const ref = (url.match(/https?:\/\/([^.]+)\.supabase\.co/) || [])[1] || "<project-ref>";

if (await exists(".env")) {
  console.log("\n  .env already exists — leaving it untouched. Verify it has:");
  console.log(`    VITE_SUPABASE_URL=${url}`);
  console.log(`    VITE_SUPABASE_ANON_KEY=${anon}`);
} else {
  await writeFile(".env", `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${anon}\n`);
  console.log("\n  ✓ Wrote .env");
}

// 2. Brand basics (reminder — brand.ts is the source of truth for text/imagery)
const product = await ask("Product name (for ASSISTANT secrets)", "Harbormill AIOS");
const assistant = await ask("Assistant name", "Aria");
console.log(
  `\n  Reminder: edit src/config/brand.ts (names/logos), src/index.css (colors),\n  and src/config/features.ts (toggle modules) to finish white-labeling.`
);

// 3. Ordered backend checklist
const fns = ["report-ingest", "assistant-chat", "knowledge-sync", "google-workspace-proxy"];
console.log(`
  Next, run these in order (review each before running):

  1. Link & push schema
     supabase link --project-ref ${ref}
     supabase db push

  2. Seed the first admin (Supabase dashboard → Auth → Add user, then SQL):
     insert into public.user_roles (user_id, role) values ('<user-uuid>', 'admin');

  3. (Optional) load demo data: paste supabase/seed.sql into the SQL editor.

  4. Deploy edge functions:
${fns.map((f) => `     supabase functions deploy ${f}`).join("\n")}

  5. Set function secrets:
     supabase secrets set ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-...
     supabase secrets set PRODUCT_NAME=${JSON.stringify(product)} ASSISTANT_NAME=${JSON.stringify(assistant)}
     # Optional: ANTHROPIC_MODEL, DISABLED_TOOLS=tool_a,tool_b, Google OAuth secrets

  6. Sync the knowledge wiki into Aria's RAG:
     npm run sync:wiki

  7. Run it:
     npm run dev    # local
     npm run build  # production (deploy dist/ to any static host)

  Full reference: docs/client-setup.md
`);

rl.close();
