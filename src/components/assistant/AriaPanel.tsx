import { ChevronLeft, X } from "lucide-react";
import { useAria } from "@/hooks/useAria";
import { brand } from "@/config/brand";
import { motion, AnimatePresence } from "@/lib/motion";
import { AriaAvatar } from "@/components/assistant/AriaAvatar";
import { AriaTray } from "@/components/assistant/AriaTray";
import { AriaChatView } from "@/components/assistant/AriaChatView";

// The Aria panel: a right-anchored card on desktop, a bottom sheet on mobile.
// Renders the tray or the chat view based on the provider's stage machine.
export function AriaPanel() {
  const { stage, close, collapse, isThinking } = useAria();
  const isOpen = stage !== "closed";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop (tap to close) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm sm:hidden"
            aria-hidden
          />

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-label={`${brand.assistantName} assistant`}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[70vh] flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-card-lg sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[34rem] sm:w-[24rem] sm:rounded-2xl"
          >
            <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              {stage === "chat" && (
                <button
                  type="button"
                  aria-label="Back"
                  onClick={collapse}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <AriaAvatar size="sm" thinking={isThinking} />
              <span className="text-sm font-bold text-foreground">{brand.assistantName}</span>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1">
              {stage === "chat" ? <AriaChatView /> : <AriaTray />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
