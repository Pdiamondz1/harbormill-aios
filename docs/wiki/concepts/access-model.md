---
title: Access Model
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/migrations, CLAUDE.md]
tags: [architecture, auth, rls, security]
---

# Access Model

How [[Harbormill AIOS]] gates who sees what.

- **Roles:** `app_role` = `admin` | `stakeholder`, provisioned via the
  `user_roles` table. **No public signup** — users are invited/provisioned.
- **RLS helpers:** `has_role`, `is_admin`, `has_access` gate row access in
  Postgres.
- **Findings are admin-only.** Stakeholders see published briefings, metrics,
  and knowledge; admins additionally triage findings and publish briefs.

## Key Decisions

- The privileged write path (service role, [[Report-Ingest Seam]]) is separate
  from this RLS-gated read path — agents ingest, users read.
- Tier labels (admin / stakeholder display names) are rebrandable per client via
  `brand.ts` ([[White-Label Architecture]]).

## See Also

- [[Harbormill AIOS]]
- [[Report-Ingest Seam]]
- [[White-Label Architecture]]
- [[Project Context]]
