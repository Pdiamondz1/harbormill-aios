import type { Loop } from "./types.ts";
import { arFollowup } from "./ar-followup.ts";

export const LOOPS: Record<string, Loop> = {
  [arFollowup.type]: arFollowup,
};
