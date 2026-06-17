import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GoogleConnectionStatus {
  connected: boolean;
  needs_reconnect?: boolean;
  google_email?: string;
  scopes?: string[];
  has_folder?: boolean;
  connected_at?: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
}

export type WorkspaceFileKind = "doc" | "sheet" | "slides";

async function callProxy<T>(body: Record<string, unknown>): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No active session");
  const response = await fetch(`${SUPABASE_URL}/functions/v1/google-workspace-proxy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Google Workspace request failed");
  return data as T;
}

/** Connection state via the status RPC (token columns can never appear here). */
export function useGoogleConnection() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["workspace", "connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("google_connection_status");
      if (error) throw error;
      return data as unknown as GoogleConnectionStatus;
    },
    enabled: !!user,
  });
}

export function useConnectGoogle() {
  return useMutation({
    mutationFn: async () => {
      const { url } = await callProxy<{ url: string }>({ action: "auth_url" });
      window.location.assign(url);
    },
  });
}

export function useCompleteGoogleConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) =>
      callProxy<{ success: boolean; google_email: string }>({ action: "oauth_callback", code, state }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace"] }),
  });
}

export function useDisconnectGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => callProxy<{ success: boolean }>({ action: "disconnect" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace"] }),
  });
}

const filesKey = (userId?: string) => ["workspace", "files", userId];

export function useWorkspaceFiles() {
  const { user } = useAuth();
  const connection = useGoogleConnection();
  return useQuery({
    queryKey: filesKey(user?.id),
    queryFn: async () => (await callProxy<{ files: WorkspaceFile[] }>({ action: "list_files" })).files,
    enabled: !!user && !!connection.data?.connected,
  });
}

function useUpdateFilesCache() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return (update: (files: WorkspaceFile[]) => WorkspaceFile[]) => {
    queryClient.setQueryData<WorkspaceFile[]>(filesKey(user?.id), (files) => update(files ?? []));
    queryClient.invalidateQueries({ queryKey: ["workspace", "files"] });
  };
}

export function useCreateWorkspaceFile() {
  const updateCache = useUpdateFilesCache();
  return useMutation({
    mutationFn: async ({ kind, name }: { kind: WorkspaceFileKind; name: string }) =>
      (await callProxy<{ file: WorkspaceFile }>({ action: "create_file", kind, name })).file,
    onSuccess: (file) => updateCache((files) => [file, ...files]),
  });
}

export function useRenameWorkspaceFile() {
  const updateCache = useUpdateFilesCache();
  return useMutation({
    mutationFn: async ({ fileId, name }: { fileId: string; name: string }) =>
      (await callProxy<{ file: WorkspaceFile }>({ action: "rename_file", file_id: fileId, name })).file,
    onSuccess: (file) => updateCache((files) => files.map((f) => (f.id === file.id ? file : f))),
  });
}

export function useTrashWorkspaceFile() {
  const updateCache = useUpdateFilesCache();
  return useMutation({
    mutationFn: async (fileId: string) => callProxy<{ success: boolean }>({ action: "trash_file", file_id: fileId }),
    onSuccess: (_, fileId) => updateCache((files) => files.filter((f) => f.id !== fileId)),
  });
}

export function useExportMetricsToSheet() {
  return useMutation({
    mutationFn: async () =>
      callProxy<{ success: boolean; link?: string; rows: number }>({ action: "append_metrics_to_sheet" }),
  });
}
