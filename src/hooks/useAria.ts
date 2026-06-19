import { useContext } from "react";
import { AriaContext } from "@/contexts/aria-context";

export function useAria() {
  const ctx = useContext(AriaContext);
  if (!ctx) throw new Error("useAria must be used within an AriaProvider");
  return ctx;
}
