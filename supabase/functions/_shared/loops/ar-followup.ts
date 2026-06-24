import type { Loop, LoopContext, LoopPlan, ProposedAction } from "./types.ts";
import { daysOverdue, estimateRecoverableCents, dueForReminder } from "./ar-followup-map.ts";

interface ArConfig {
  cadence_days?: number[];
  audit_opportunity_id?: string;
  sender_name?: string;
}

export const arFollowup: Loop = {
  type: "ar_followup",
  async plan(ctx: LoopContext): Promise<LoopPlan> {
    const cfg = ctx.config as ArConfig;
    const cadence = cfg.cadence_days?.length ? cfg.cadence_days : [7, 14, 30];
    const now = new Date();

    const { data: invoices, error } = await ctx.supabase
      .from("ar_invoices").select("*").eq("status", "open");
    if (error) throw error;

    // Load invoice_ids that already have a non-terminal proposed action so we
    // don't queue a duplicate reminder every hour for unapproved invoices.
    const { data: pending, error: pendErr } = await ctx.supabase
      .from("loop_actions")
      .select("target")
      .eq("status", "proposed");
    if (pendErr) throw pendErr;
    const alreadyQueued = new Set(
      (pending ?? [])
        .map((p: { target: { invoice_id?: string } }) => p.target?.invoice_id)
        .filter(Boolean),
    );

    const actions: ProposedAction[] = [];
    let openTotal = 0, overdueTotal = 0;

    for (const inv of invoices ?? []) {
      openTotal += inv.amount_cents;
      const overdue = daysOverdue(inv.due_date, now);
      if (overdue <= 0) continue;
      overdueTotal += inv.amount_cents;
      if (!dueForReminder(overdue, inv.last_reminded_at, cadence, now)) continue;
      // Skip if a proposed action for this invoice is already awaiting approval.
      if (alreadyQueued.has(inv.id)) continue;

      const valueCents = estimateRecoverableCents(inv.amount_cents, overdue);
      const amount = (inv.amount_cents / 100).toLocaleString("en-US",
        { style: "currency", currency: "USD" });
      actions.push({
        type: "email_reminder",
        target: { recipient: inv.customer_email, invoice_id: inv.id, external_id: inv.external_id },
        payload: {
          subject: `Friendly reminder: invoice ${inv.external_id} (${amount})`,
          body_md:
            `Hi ${inv.customer_name},\n\nThis is a friendly reminder that invoice ` +
            `**${inv.external_id}** for **${amount}** was due on ${inv.due_date} ` +
            `(${overdue} days ago). If it's already on its way, thank you — please ` +
            `disregard.\n\nBest,\n${cfg.sender_name ?? "Accounts Receivable"}`,
        },
        value_estimate_cents: valueCents,
        value_category: "revenue_captured",
        audit_opportunity_id: cfg.audit_opportunity_id ?? null,
        metadata: { invoice_id: inv.id, days_overdue: overdue, amount_cents: inv.amount_cents,
          basis: "amount × recovery_likelihood(days_overdue)" },
      });
    }

    const metrics = [
      { key: "ar_open_total", label: "AR Outstanding",
        value: `$${(openTotal / 100).toLocaleString("en-US")}`, unit: "$" },
      { key: "ar_overdue_total", label: "AR Overdue",
        value: `$${(overdueTotal / 100).toLocaleString("en-US")}`, unit: "$",
        status: overdueTotal > 0 ? "at_risk" as const : "on_track" as const },
    ];
    return { actions, metrics };
  },
};
