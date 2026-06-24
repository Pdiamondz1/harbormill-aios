// google-workspace-proxy
// The single audited gateway between the deck and Google. Tokens never leave
// this backend: clients receive consent URLs, status objects, file metadata,
// and links — never an access or refresh token.
//
// Auth:
//  - User mode: Supabase session JWT → server-side access-tier check; every
//    action operates on the CALLER's own connection.
//  - Service mode: exact SUPABASE_SERVICE_ROLE_KEY bearer; permits ONLY the
//    metrics append, which targets the GOOGLE_EXPORT_USER_ID account.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  GoogleWorkspaceError,
  GOOGLE_SCOPES,
  appendMetricsRows,
  assertDriveFileId,
  assertFileKind,
  assertFileName,
  buildAuthUrl,
  createGoogleFile,
  driveCtx,
  exchangeCode,
  exportMarkdownToDoc,
  findOrCreateFolder,
  getValidAccessToken,
  listFiles,
  parseIdToken,
  renameDriveFile,
  revokeToken,
  sendGmail,
  signState,
  trashDriveFile,
  verifyState,
} from "../_shared/google-workspace.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  // Append the latest metric snapshot to the export account's Drive sheet.
  // deno-lint-ignore no-explicit-any
  const appendMetrics = async (supabaseAdmin: any, exportUserId: string, includeLink: boolean) => {
    const { data: metrics, error } = await supabaseAdmin
      .from("metric_latest")
      .select("key, label, value, unit, target, status, captured_at");
    if (error) throw error;
    const { token, folderId } = await driveCtx(supabaseAdmin, exportUserId);
    const result = await appendMetricsRows(token, folderId, metrics ?? []);
    return json({ success: true, created: result.created, rows: result.rows, ...(includeLink ? { link: result.link } : {}) });
  };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // Service-bearer mode: scheduled agents, metrics append only.
    const bearer = (authHeader.match(/^Bearer\s+(.+)$/i)?.[1] ?? "").trim();
    const serviceKeyUsable = SERVICE_ROLE_KEY.length > 20 && SERVICE_ROLE_KEY !== ANON_KEY;
    if (serviceKeyUsable && bearer === SERVICE_ROLE_KEY) {
      if (action !== "append_metrics_to_sheet") {
        return json({ error: "service mode permits only append_metrics_to_sheet", code: "forbidden_service_action" }, 403);
      }
      const exportUserId = Deno.env.get("GOOGLE_EXPORT_USER_ID");
      if (!exportUserId) return json({ error: "GOOGLE_EXPORT_USER_ID not configured", code: "export_unconfigured" }, 400);
      return await appendMetrics(supabaseAdmin, exportUserId, false);
    }

    // User mode: session → access-tier check.
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id);
    const hasAccess = (roles ?? []).some((r: { role: string }) => ["admin", "stakeholder"].includes(r.role));
    if (!hasAccess) return json({ error: "forbidden: access required" }, 403);

    switch (action) {
      case "auth_url": {
        const state = await signState({ user_id: user.id, nonce: crypto.randomUUID(), iat: Date.now() });
        return json({ url: buildAuthUrl(state) });
      }

      case "oauth_callback": {
        const { code, state } = body;
        if (typeof code !== "string" || typeof state !== "string") {
          return json({ error: "code and state are required" }, 400);
        }
        await verifyState(state, user.id);
        const tokens = await exchangeCode(code);
        if (!tokens.refresh_token) {
          return json({ error: "Google did not return a refresh token — retry the connect flow" }, 400);
        }
        const identity = parseIdToken(tokens.id_token ?? "");
        if (!identity.email) {
          await revokeToken(tokens.refresh_token);
          return json({ error: "Google identity missing from token response" }, 400);
        }
        // Optional Workspace-domain restriction via the hd claim.
        const allowedDomain = Deno.env.get("GOOGLE_ALLOWED_DOMAIN");
        if (allowedDomain && identity.hd?.toLowerCase() !== allowedDomain.toLowerCase()) {
          await revokeToken(tokens.refresh_token);
          return json({ error: `Only ${allowedDomain} Google accounts can connect` }, 403);
        }

        const folderId = await findOrCreateFolder(tokens.access_token);
        const { error: upsertError } = await supabaseAdmin.from("google_workspace_accounts").upsert(
          {
            user_id: user.id,
            google_email: identity.email,
            scopes: GOOGLE_SCOPES,
            refresh_token: tokens.refresh_token,
            access_token: tokens.access_token,
            access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            folder_id: folderId,
            status: "active",
          },
          { onConflict: "user_id" }
        );
        if (upsertError) throw upsertError;
        return json({ success: true, google_email: identity.email });
      }

      case "disconnect": {
        const { data: account } = await supabaseAdmin
          .from("google_workspace_accounts")
          .select("id, refresh_token")
          .eq("user_id", user.id)
          .maybeSingle();
        if (account) {
          const outcome = await revokeToken(account.refresh_token);
          if (outcome === "failed") {
            return json({ error: "Google did not confirm the revocation — try again", code: "revoke_failed" }, 502);
          }
          await supabaseAdmin.from("google_workspace_accounts").delete().eq("id", account.id);
        }
        return json({ success: true });
      }

      case "list_files": {
        const { token, folderId } = await driveCtx(supabaseAdmin, user.id);
        return json({ files: await listFiles(token, folderId) });
      }

      case "create_file": {
        const mimeType = assertFileKind(body.kind);
        const name = assertFileName(body.name);
        const { token, folderId } = await driveCtx(supabaseAdmin, user.id);
        return json({ file: await createGoogleFile(token, folderId, mimeType, name) });
      }

      case "rename_file": {
        const fileId = assertDriveFileId(body.file_id);
        const name = assertFileName(body.name);
        const { token } = await getValidAccessToken(supabaseAdmin, user.id);
        return json({ file: await renameDriveFile(token, fileId, name) });
      }

      case "trash_file": {
        const fileId = assertDriveFileId(body.file_id);
        const { token } = await getValidAccessToken(supabaseAdmin, user.id);
        await trashDriveFile(token, fileId);
        return json({ success: true });
      }

      case "export_markdown_to_doc": {
        const title = assertFileName(body.title);
        const markdown = typeof body.markdown === "string" ? body.markdown.trim() : "";
        if (!markdown) return json({ error: "markdown is required", code: "bad_markdown" }, 400);
        if (markdown.length > 500_000) return json({ error: "markdown too large", code: "bad_markdown" }, 400);
        const docId = body.doc_id ? assertDriveFileId(body.doc_id) : undefined;
        const { token, folderId } = await driveCtx(supabaseAdmin, user.id);
        return json({ file: await exportMarkdownToDoc(token, folderId, title, markdown, docId) });
      }

      case "append_metrics_to_sheet":
        return await appendMetrics(supabaseAdmin, user.id, true);

      case "gmail_send": {
        const { to, subject, body: emailBody } = body;
        if (typeof to !== "string" || !to.trim()) {
          return json({ error: "to is required", code: "bad_request" }, 400);
        }
        if (typeof subject !== "string" || !subject.trim()) {
          return json({ error: "subject is required", code: "bad_request" }, 400);
        }
        if (typeof emailBody !== "string" || !emailBody.trim()) {
          return json({ error: "body is required", code: "bad_request" }, 400);
        }
        const { token } = await getValidAccessToken(supabaseAdmin, user.id);
        const result = await sendGmail(token, { to: to.trim(), subject: subject.trim(), body: emailBody });
        return json({ success: true, id: result.id, threadId: result.threadId });
      }

      default:
        return json({ error: `Unknown action "${action}"` }, 400);
    }
  } catch (err) {
    if (err instanceof GoogleWorkspaceError) {
      return json({ error: err.message, code: err.code }, err.status);
    }
    const message = err instanceof Error ? err.message : "internal error";
    console.error("[google-workspace-proxy]", message);
    return json({ error: message }, 500);
  }
});
