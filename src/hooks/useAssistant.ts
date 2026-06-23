import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { parseNdjson } from "@/lib/aria/stream";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

/**
 * Assistant chat backed by one conversation per user. The edge function
 * persists both the user message and the reply; this hook reflects the stored
 * thread and shows the in-flight user turn optimistically.
 */
export function useAssistant() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [actions, setActions] = useState<{ label: string; route: string }[]>([]);

  const { data: conversation } = useQuery({
    queryKey: ["assistant", "conversation", user?.id],
    queryFn: async () => {
      const { data: existing, error: fetchErr } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user!.id)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (existing) return existing as { id: string };

      const { data: created, error: createErr } = await supabase
        .from("conversations")
        .insert({ user_id: user!.id })
        .select("id")
        .single();
      if (createErr) throw createErr;
      return created as { id: string };
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["assistant", "messages", conversation?.id],
    queryFn: async () => {
      const { data, error: fetchErr } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversation!.id)
        .in("role", ["user", "assistant"])
        .order("created_at", { ascending: true });
      if (fetchErr) throw fetchErr;
      return (data ?? []) as ChatMessage[];
    },
    enabled: !!conversation,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation) throw new Error("No active conversation");
      setError(null);
      setPending(content);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/assistant-chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation_id: conversation.id, message: content }),
      });
      if (!resp.ok || !resp.body) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || "The assistant could not respond");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      setStreamingText("");
      setStatusLabel(null);
      setActions([]);
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const parsed = parseNdjson(buffer, decoder.decode(value, { stream: true }));
          buffer = parsed.buffer;
          for (const ev of parsed.events) {
            if (ev.type === "text") {
              acc += ev.delta;
              setStreamingText(acc);
            } else if (ev.type === "status") {
              setStatusLabel(ev.label);
            } else if (ev.type === "done") {
              setActions(ev.actions ?? []);
              return { content: ev.content };
            } else if (ev.type === "error") {
              throw new Error(ev.message);
            }
            // heartbeat: ignore
          }
        }
        throw new Error("The assistant response was cut off");
      } finally {
        reader.cancel().catch(() => {});
      }
    },
    onSettled: () => {
      setPending(null);
      setStreamingText("");
      setStatusLabel(null);
      queryClient.invalidateQueries({ queryKey: ["assistant", "messages", conversation?.id] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Something went wrong"),
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (sendMutation.isPending || !content.trim()) return;
      sendMutation.mutate(content.trim());
    },
    [sendMutation]
  );

  return {
    messages,
    pending,
    sendMessage,
    isThinking: sendMutation.isPending,
    error,
    streamingText,
    statusLabel,
    actions,
  };
}
