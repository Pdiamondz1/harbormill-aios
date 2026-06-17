import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Fade-and-rise on scroll into view. Respects prefers-reduced-motion via framer. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.5, 0.31, 1] }}
    >
      {children}
    </motion.div>
  );
}
