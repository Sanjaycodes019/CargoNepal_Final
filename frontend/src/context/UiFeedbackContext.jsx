import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const UiFeedbackContext = createContext(null);

export const UiFeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const [confirmState, setConfirmState] = useState(null);
  const confirmResolverRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options) => {
    const { message, type = "info", durationMs = 3500 } = options || {};
    if (!message) return;

    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => {
      removeToast(id);
    }, durationMs);
  }, [removeToast]);

  const confirm = useCallback((options) => {
    const {
      title = "Confirm",
      message = "Are you sure?",
      confirmText = "Confirm",
      cancelText = "Cancel",
    } = options || {};

    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({ title, message, confirmText, cancelText });
    });
  }, []);

  const closeConfirm = useCallback((value) => {
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setConfirmState(null);
    if (resolver) resolver(value);
  }, []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <UiFeedbackContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
      <ConfirmDialog confirmState={confirmState} onClose={closeConfirm} />
    </UiFeedbackContext.Provider>
  );
};

export const useUiFeedback = () => {
  const ctx = useContext(UiFeedbackContext);
  if (!ctx) {
    throw new Error("useUiFeedback must be used within UiFeedbackProvider");
  }
  return ctx;
};

const ToastViewport = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onDismiss }) => {
  const [entered, setEntered] = useState(false);

  const meta =
    toast.type === "success"
      ? {
          title: "Success",
          shell: "bg-black text-white border-white/10",
          iconShell: "bg-white/10 border-white/10",
          icon: <CheckIcon className="h-4 w-4" />,
        }
      : toast.type === "error"
        ? {
            title: "Error",
            shell: "bg-white/90 text-gray-900 border-gray-200",
            iconShell: "bg-black/5 border-black/10",
            icon: <XIcon className="h-4 w-4 text-gray-900" />,
          }
        : {
            title: "Info",
            shell: "bg-white/90 text-gray-900 border-gray-200",
            iconShell: "bg-black/5 border-black/10",
            icon: <InfoIcon className="h-4 w-4 text-gray-900" />,
          };

  useMemo(() => {
    const raf = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`rounded-2xl border shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)] backdrop-blur supports-[backdrop-filter]:backdrop-blur ${meta.shell} transition-all duration-200 ${
        entered ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border ${meta.iconShell}`}>
          {meta.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs font-bold tracking-wide ${toast.type === "success" ? "text-white/80" : "text-gray-600"}`}>
              {meta.title}
            </p>
            <button
              onClick={onDismiss}
              className={`-mr-1 inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                toast.type === "success" ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-black/5 hover:text-gray-900"
              }`}
              aria-label="Dismiss"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className={`mt-0.5 text-sm font-semibold leading-snug break-words ${toast.type === "success" ? "text-white" : "text-gray-900"}`}>
            {toast.message}
          </p>
        </div>
      </div>
    </div>
  );
};

const CheckIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const InfoIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ConfirmDialog = ({ confirmState, onClose }) => {
  if (!confirmState) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-bold text-gray-900">{confirmState.title}</h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-700 leading-relaxed break-words">{confirmState.message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={() => onClose(false)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            {confirmState.cancelText}
          </button>
          <button
            onClick={() => onClose(true)}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
          >
            {confirmState.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
