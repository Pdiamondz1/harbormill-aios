---
title: Google Workspace Bridge
type: entity
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/functions/google-workspace-proxy/index.ts, supabase/functions/_shared/google-workspace.ts, src/pages/Workspace.tsx, src/hooks/useGoogleWorkspace.ts, supabase/migrations/20260617000300_workspace.sql]
tags: [integration, google, oauth, technical]
---

# Google Workspace Bridge

Lets a [[Harbormill AIOS]] user connect their Google account and work with Drive
files from the deck. Implemented as the `google-workspace-proxy` edge function —
a **single audited gateway**; OAuth tokens never reach the client.

## What it does

Per-user OAuth (`drive.file` scope only). Actions: `auth_url`, `oauth_callback`,
`disconnect`, `list_files`, `create_file` (Doc/Sheet/Slide), `rename_file`,
`trash_file`, `export_markdown_to_doc`, `append_metrics_to_sheet`. [[Aria]] uses
the export/list actions via the [[AI Tool Registry]].

## Auth & token safety

- **User mode:** Supabase JWT + `has_access` ([[Access Model]]); operates on the
  caller's own connection.
- **Service mode:** service-role bearer, restricted to `append_metrics_to_sheet`
  for a configured export account (scheduled metrics → Sheet).
- Refresh/access tokens live in `google_workspace_accounts` (**service-role-only**,
  no RLS policies). OAuth `state` is HMAC-signed with a TTL. Clients only ever get
  consent URLs, file metadata, and `webViewLink`s.

## Config (function secrets)

`GOOGLE_OAUTH_CLIENT_ID/SECRET`, `GOOGLE_OAUTH_STATE_SECRET`, `GOOGLE_REDIRECT_URI`,
optional `WORKSPACE_FOLDER_NAME`, `GOOGLE_ALLOWED_DOMAIN`, `GOOGLE_EXPORT_USER_ID`.

## See Also

- [[Edge Functions]]
- [[Aria]]
- [[AI Tool Registry]]
- [[Harbormill AIOS]]
