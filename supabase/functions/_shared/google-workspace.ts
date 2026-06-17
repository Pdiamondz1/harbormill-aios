// Shared Google Workspace helpers — used by google-workspace-proxy and the
// assistant's Workspace tools, so OAuth/token/Drive logic exists exactly once.
//
// Scope model: drive.file only (non-sensitive). The app sees only files it
// created — the hub is the per-account folder it bootstraps. Tokens NEVER leave
// the backend; callers receive data, links, or typed errors.
//
// Per-client config (function secrets): GOOGLE_OAUTH_CLIENT_ID,
// GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_STATE_SECRET, GOOGLE_REDIRECT_URI,
// and optionally WORKSPACE_FOLDER_NAME / GOOGLE_ALLOWED_DOMAIN.

// deno-lint-ignore-file no-explicit-any

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";

export const GOOGLE_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/drive.file"];
export const FOLDER_NAME = Deno.env.get("WORKSPACE_FOLDER_NAME") ?? "Harbormill AIOS";

export class GoogleWorkspaceError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new GoogleWorkspaceError("not_configured", `${name} is not configured`, 503);
  return v;
}

// ── HMAC-signed OAuth state: tamper resistance + TTL + user binding ──
function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad), (c) => c.charCodeAt(0));
}
async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env("GOOGLE_OAUTH_STATE_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface OAuthState {
  user_id: string;
  nonce: string;
  iat: number;
}

export async function signState(payload: OAuthState): Promise<string> {
  const body = new TextEncoder().encode(JSON.stringify(payload));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), body));
  return `${b64url(body)}.${b64url(sig)}`;
}

const STATE_TTL_MS = 10 * 60 * 1000;

export async function verifyState(state: string, expectedUserId: string): Promise<OAuthState> {
  const dot = state.lastIndexOf(".");
  if (dot < 0) throw new GoogleWorkspaceError("bad_state", "Malformed state");
  const body = b64urlDecode(state.slice(0, dot));
  const sig = b64urlDecode(state.slice(dot + 1));
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(), sig as BufferSource, body as BufferSource);
  if (!ok) throw new GoogleWorkspaceError("bad_state", "State signature mismatch", 403);
  const payload = JSON.parse(new TextDecoder().decode(body)) as OAuthState;
  if (Date.now() - payload.iat > STATE_TTL_MS) {
    throw new GoogleWorkspaceError("state_expired", "State expired — restart the connect flow", 403);
  }
  if (payload.user_id !== expectedUserId) {
    throw new GoogleWorkspaceError("bad_state", "State does not belong to this user", 403);
  }
  return payload;
}

// ── OAuth: consent URL, code exchange, identity, revoke ──
export function redirectUri(): string {
  return env("GOOGLE_REDIRECT_URI");
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent", // guarantees a refresh_token on every connect
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!resp.ok) {
    console.error("[google-workspace] code exchange failed:", resp.status, (await resp.text()).slice(0, 300));
    throw new GoogleWorkspaceError("exchange_failed", "Google rejected the authorization code", 400);
  }
  return resp.json();
}

export function parseIdToken(idToken: string): { email?: string; hd?: string } {
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(idToken.split(".")[1])));
    return { email: payload.email, hd: payload.hd };
  } catch {
    return {};
  }
}

export type RevokeOutcome = "revoked" | "already_invalid" | "failed";

export async function revokeToken(token: string): Promise<RevokeOutcome> {
  try {
    const resp = await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (resp.ok) return "revoked";
    return resp.status === 400 ? "already_invalid" : "failed";
  } catch (err) {
    console.error("[google-workspace] revoke errored:", err instanceof Error ? err.message : err);
    return "failed";
  }
}

// ── Token loading with inline refresh ──
export interface GoogleAccount {
  id: string;
  user_id: string;
  google_email: string;
  refresh_token: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  folder_id: string | null;
  status: string;
}

export async function getValidAccessToken(
  supabaseAdmin: any,
  userId: string
): Promise<{ token: string; account: GoogleAccount }> {
  const { data: account, error } = await supabaseAdmin
    .from("google_workspace_accounts")
    .select("id, user_id, google_email, refresh_token, access_token, access_token_expires_at, folder_id, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!account || account.status === "revoked") {
    throw new GoogleWorkspaceError("not_connected", "No Google connection — connect on the Workspace page", 409);
  }
  if (account.status === "needs_reconnect") {
    throw new GoogleWorkspaceError("needs_reconnect", "Google connection needs to be re-linked", 409);
  }

  const expiresAt = account.access_token_expires_at ? Date.parse(account.access_token_expires_at) : 0;
  if (account.access_token && expiresAt - Date.now() > 60_000) {
    return { token: account.access_token, account };
  }

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: account.refresh_token,
      client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) {
    console.error("[google-workspace] refresh failed:", resp.status, (await resp.text()).slice(0, 200));
    await supabaseAdmin.from("google_workspace_accounts").update({ status: "needs_reconnect" }).eq("id", account.id);
    throw new GoogleWorkspaceError("needs_reconnect", "Google connection expired — re-link on the Workspace page", 409);
  }
  const fresh = (await resp.json()) as TokenResponse;
  await supabaseAdmin
    .from("google_workspace_accounts")
    .update({
      access_token: fresh.access_token,
      access_token_expires_at: new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
    })
    .eq("id", account.id);
  return { token: fresh.access_token, account };
}

// ── Drive ──
export async function driveRequest(token: string, url: string, init: RequestInit = {}): Promise<any> {
  const resp = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!resp.ok) {
    console.error("[google-workspace] Drive API error:", resp.status, (await resp.text()).slice(0, 300));
    throw new GoogleWorkspaceError("google_api_error", `Google API error (${resp.status})`, 502);
  }
  return resp.status === 204 ? null : resp.json();
}

const FILE_FIELDS = "id,name,mimeType,modifiedTime,webViewLink,webContentLink";
const GOOGLE_FILE_KINDS: Record<string, string> = {
  doc: "application/vnd.google-apps.document",
  sheet: "application/vnd.google-apps.spreadsheet",
  slides: "application/vnd.google-apps.presentation",
};

export function assertFileKind(kind: unknown): string {
  const mimeType = typeof kind === "string" ? GOOGLE_FILE_KINDS[kind] : undefined;
  if (!mimeType) throw new GoogleWorkspaceError("bad_kind", "kind must be doc, sheet, or slides");
  return mimeType;
}

const DRIVE_FILE_ID = /^[A-Za-z0-9_-]{10,100}$/;
export function assertDriveFileId(fileId: unknown): string {
  if (typeof fileId !== "string" || !DRIVE_FILE_ID.test(fileId)) {
    throw new GoogleWorkspaceError("bad_file_id", "Invalid file id");
  }
  return fileId;
}
export function assertFileName(name: unknown): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || trimmed.length > 200) throw new GoogleWorkspaceError("bad_name", "File name must be 1–200 characters");
  return trimmed;
}

export async function findOrCreateFolder(token: string): Promise<string> {
  const q = encodeURIComponent(
    `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const found = await driveRequest(token, `${DRIVE_FILES_URL}?q=${q}&fields=files(id)`);
  if (found.files?.length) return found.files[0].id;
  const created = await driveRequest(token, DRIVE_FILES_URL, {
    method: "POST",
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  return created.id;
}

export async function ensureFolder(supabaseAdmin: any, account: GoogleAccount, token: string): Promise<string> {
  if (account.folder_id) return account.folder_id;
  const folderId = await findOrCreateFolder(token);
  await supabaseAdmin.from("google_workspace_accounts").update({ folder_id: folderId }).eq("id", account.id);
  return folderId;
}

export async function driveCtx(
  supabaseAdmin: any,
  userId: string
): Promise<{ token: string; account: GoogleAccount; folderId: string }> {
  const { token, account } = await getValidAccessToken(supabaseAdmin, userId);
  return { token, account, folderId: await ensureFolder(supabaseAdmin, account, token) };
}

export async function listFiles(token: string, folderId: string): Promise<any[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    orderBy: "modifiedTime desc",
    pageSize: "100",
    fields: `files(${FILE_FIELDS})`,
  });
  const data = await driveRequest(token, `${DRIVE_FILES_URL}?${params}`);
  return data.files ?? [];
}

export async function createGoogleFile(token: string, folderId: string, mimeType: string, name: string): Promise<any> {
  return driveRequest(token, `${DRIVE_FILES_URL}?fields=${FILE_FIELDS}`, {
    method: "POST",
    body: JSON.stringify({ name, mimeType, parents: [folderId] }),
  });
}

export async function renameDriveFile(token: string, fileId: string, name: string): Promise<any> {
  return driveRequest(token, `${DRIVE_FILES_URL}/${fileId}?fields=${FILE_FIELDS}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function trashDriveFile(token: string, fileId: string): Promise<void> {
  await driveRequest(token, `${DRIVE_FILES_URL}/${fileId}`, { method: "PATCH", body: JSON.stringify({ trashed: true }) });
}

/** Export markdown as a Google Doc. Pass existingDocId to overwrite in place. */
export async function exportMarkdownToDoc(
  token: string,
  folderId: string,
  title: string,
  markdown: string,
  existingDocId?: string
): Promise<any> {
  const upload = async (docId?: string) => {
    const metadata = docId
      ? { name: title }
      : { name: title, mimeType: "application/vnd.google-apps.document", parents: [folderId] };
    const boundary = `export-${crypto.randomUUID()}`;
    const body = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify(metadata),
      `--${boundary}`,
      "Content-Type: text/markdown; charset=UTF-8",
      "",
      markdown,
      `--${boundary}--`,
      "",
    ].join("\r\n");
    const url = `${DRIVE_UPLOAD_URL}${docId ? `/${docId}` : ""}?uploadType=multipart&fields=${FILE_FIELDS}`;
    return fetch(url, {
      method: docId ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
  };
  let resp = await upload(existingDocId);
  if (existingDocId && resp.status === 404) resp = await upload();
  if (!resp.ok) {
    console.error("[google-workspace] doc export failed:", resp.status, (await resp.text()).slice(0, 300));
    throw new GoogleWorkspaceError("google_api_error", `Doc export failed (${resp.status})`, 502);
  }
  return resp.json();
}

// ── Metrics → Sheet (long format: one row per metric per run) ──
const METRICS_SHEET_NAME = "Metrics";
const METRIC_HEADER = ["Exported at", "Key", "Label", "Value", "Unit", "Target", "Status", "Captured at"];
const sheetValuesUrl = (id: string, range: string) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}`;

async function findOrCreateMetricsSheet(token: string, folderId: string): Promise<{ id: string; link?: string; created: boolean }> {
  const q = encodeURIComponent(
    `name = '${METRICS_SHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and '${folderId}' in parents and trashed = false`
  );
  const found = await driveRequest(token, `${DRIVE_FILES_URL}?q=${q}&fields=files(id,webViewLink)`);
  if (found.files?.length) return { id: found.files[0].id, link: found.files[0].webViewLink, created: false };
  const created = await driveRequest(token, `${DRIVE_FILES_URL}?fields=id,webViewLink`, {
    method: "POST",
    body: JSON.stringify({ name: METRICS_SHEET_NAME, mimeType: "application/vnd.google-apps.spreadsheet", parents: [folderId] }),
  });
  await driveRequest(token, `${sheetValuesUrl(created.id, "A1")}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [METRIC_HEADER] }),
  });
  return { id: created.id, link: created.webViewLink, created: true };
}

/** Append the latest metric snapshot (one row per metric) to the Metrics sheet. */
export async function appendMetricsRows(
  token: string,
  folderId: string,
  metrics: Array<Record<string, unknown>>
): Promise<{ link?: string; created: boolean; rows: number }> {
  const sheet = await findOrCreateMetricsSheet(token, folderId);
  const exportedAt = new Date().toISOString();
  const rows = metrics.map((m) => [
    exportedAt,
    m.key ?? "",
    m.label ?? "",
    m.value ?? "",
    m.unit ?? "",
    m.target ?? "",
    m.status ?? "",
    m.captured_at ?? "",
  ]);
  if (rows.length > 0) {
    await driveRequest(
      token,
      `${sheetValuesUrl(sheet.id, "A1")}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ values: rows }) }
    );
  }
  return { link: sheet.link, created: sheet.created, rows: rows.length };
}
