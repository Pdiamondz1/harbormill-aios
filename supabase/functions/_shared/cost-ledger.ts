// Minimal AI-spend logging. Best-effort: never blocks the request.
// deno-lint-ignore no-explicit-any
export async function logCost(
  supabase: any,
  entry: {
    userId?: string | null;
    edgeFunction: string;
    model: string;
    inputTokens: number;
    outputTokens?: number;
  }
): Promise<void> {
  try {
    await supabase.from("cost_ledger").insert({
      user_id: entry.userId ?? null,
      edge_function: entry.edgeFunction,
      model: entry.model,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens ?? 0,
    });
  } catch (err) {
    console.error("[cost-ledger] log failed:", err instanceof Error ? err.message : err);
  }
}
