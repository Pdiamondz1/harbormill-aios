export function daysOverdue(dueDate: string, now: Date): number {
  const due = new Date(dueDate + "T00:00:00Z").getTime();
  const diff = now.getTime() - due;
  return diff <= 0 ? 0 : Math.floor(diff / 86_400_000);
}

export function recoveryLikelihood(overdue: number): number {
  if (overdue <= 0) return 0;
  if (overdue <= 14) return 0.85;
  if (overdue <= 30) return 0.7;
  if (overdue <= 60) return 0.5;
  if (overdue <= 90) return 0.3;
  return 0.15;
}

export function estimateRecoverableCents(amountCents: number, overdue: number): number {
  return Math.round(amountCents * recoveryLikelihood(overdue));
}

export function dueForReminder(
  overdue: number,
  lastRemindedAt: string | null,
  cadence: number[],
  now: Date,
): boolean {
  if (overdue < Math.min(...cadence)) return false;
  if (!lastRemindedAt) return true;
  const last = new Date(lastRemindedAt);
  const sameDay = last.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  return !sameDay;
}
