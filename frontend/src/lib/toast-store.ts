type ToastVariant = 'success' | 'error';

interface Toast {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

const AUTO_DISMISS_MS = 5_000;
// Older toasts are dropped so a burst of actions never covers the page content.
const MAX_VISIBLE_TOASTS = 3;

type Listener = () => void;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

function pushToast(variant: ToastVariant, title: string, description?: string): void {
  const id = nextId++;
  toasts = [...toasts, { id, variant, title, description }].slice(-MAX_VISIBLE_TOASTS);
  emit();
  setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
}

/**
 * A tiny framework-agnostic store, so non-React code (the Axios interceptor) can raise
 * toasts that the <Toaster /> component renders.
 */
export const toast = {
  success: (title: string, description?: string) => pushToast('success', title, description),
  error: (title: string, description?: string) => pushToast('error', title, description),
};

export function subscribeToToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): Toast[] {
  return toasts;
}
