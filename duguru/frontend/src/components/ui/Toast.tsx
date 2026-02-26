import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ─── Types ──────────────────────────────────────────────────────── */

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

/* ─── Context ────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>.");
  return ctx;
}

/* ─── Provider ───────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    [],
  );

  const value: ToastContextValue = {
    toast: add,
    success: (msg, dur) => { add(msg, "success", dur); },
    error: (msg, dur) => { add(msg, "error", dur); },
    warning: (msg, dur) => { add(msg, "warning", dur); },
    info: (msg, dur) => { add(msg, "info", dur); },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

/* ─── Container ──────────────────────────────────────────────────── */

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <div
      aria-live="assertive"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Individual Toast ───────────────────────────────────────────── */

const typeStyles: Record<ToastType, string> = {
  success: "border-l-4 border-[var(--color-success)] bg-[var(--color-surface)]",
  error: "border-l-4 border-[var(--color-error)] bg-[var(--color-surface)]",
  warning: "border-l-4 border-[var(--color-warning)] bg-[var(--color-surface)]",
  info: "border-l-4 border-[var(--color-button)] bg-[var(--color-surface)]",
};

const typeIcons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration ?? 4000);
    return () => { clearTimeout(timer); };
  }, [toast, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] p-4 shadow-lg ${typeStyles[toast.type]}`}
    >
      <span className="text-base" aria-hidden="true">
        {typeIcons[toast.type]}
      </span>
      <p className="flex-1 text-sm text-[var(--color-headline)]">{toast.message}</p>
      <button
        onClick={() => { onRemove(toast.id); }}
        aria-label="Fechar notificação"
        className="text-[var(--color-paragraph)] hover:text-[var(--color-headline)]"
      >
        ✕
      </button>
    </motion.div>
  );
}
