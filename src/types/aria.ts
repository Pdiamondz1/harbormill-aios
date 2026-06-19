// Types for the Aria assistant surface (panel + tray + chat).

/** The assistant panel is a small state machine. */
export type AriaStage = "closed" | "tray" | "chat";

/** A one-tap suggested prompt shown in the tray. */
export interface QuickChip {
  label: string;
  prompt: string;
}

/** Per-page help shown when the tray opens: a heading, an optional tip, and chips. */
export interface PageSuggestion {
  title: string;
  /** Optional contextual tip rendered as a nudge card. */
  tip?: string;
  chips: QuickChip[];
}
