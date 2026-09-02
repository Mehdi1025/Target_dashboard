"use client";

import { createContext, useCallback, useMemo, useState } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

export type ToastContextValue = {
  toasts: Toast[];
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info", duration = 5000 }: ToastInput) => {
      const id = `toast-${++toastCounter}`;
      setToasts((current) => [...current, { id, title, description, variant }]);

      window.setTimeout(() => {
        dismiss(id);
      }, duration);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
