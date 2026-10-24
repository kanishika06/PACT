import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Display, Mono } from "./primitives";

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-[rgba(3,6,12,0.75)] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`notched relative w-full p-px ${wide ? "max-w-3xl" : "max-w-lg"}`}
            style={{ background: "var(--grad)" }}
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 8, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="notched max-h-[85vh] overflow-y-auto bg-[var(--panel)] p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <Display className="text-2xl">{title}</Display>
                  {subtitle && (
                    <Mono className="mt-2 block text-[var(--faint)]">{subtitle}</Mono>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="notched-sm flex h-9 w-9 shrink-0 items-center justify-center border border-[rgba(124,58,237,0.4)] text-[var(--muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text)]"
                >
                  ✕
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
