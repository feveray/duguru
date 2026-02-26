import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Tamanho do modal. Padrão: "md" */
  size?: "sm" | "md" | "lg";
  /** Se true, clicar no overlay não fecha o modal. */
  disableBackdropClose?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

/**
 * Modal — Dialog acessível do design system duGuru.
 *
 * • role="dialog", aria-modal="true", aria-labelledby, aria-describedby
 * • Foco preso dentro do dialog enquanto aberto (focus trap)
 * • Tecla Escape fecha o modal
 * • Renderizado via Portal no body
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  disableBackdropClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "modal-title";
  const descId = "modal-desc";

  /* Fechar com Escape */
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); };
  }, [isOpen, onClose]);

  /* Focus trap simples */
  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); };
  }, [isOpen]);

  /* Prevenir scroll do body quando aberto */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        /* Backdrop */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-safe sm:items-center"
          onClick={disableBackdropClose ? undefined : onClose}
        >
          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            onClick={(e) => { e.stopPropagation(); }}
            className={`w-full ${sizeClasses[size]} rounded-t-[var(--radius-lg)] bg-[var(--color-bg)] p-6 shadow-2xl sm:rounded-[var(--radius-lg)]`}
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2
                  id={titleId}
                  className="font-display text-xl font-semibold text-[var(--color-headline)]"
                >
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-[var(--color-paragraph)]">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="rounded-full p-1 text-[var(--color-paragraph)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-headline)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
