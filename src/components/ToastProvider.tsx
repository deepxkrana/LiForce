import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-accent" />,
  error: <AlertTriangle className="w-5 h-5 text-critical" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'border-l-4 border-accent',
  error: 'border-l-4 border-critical',
  info: 'border-l-4 border-blue-400',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 max-w-xs w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              className={`bg-surface shadow-xl rounded-xl p-4 flex items-start gap-3 pointer-events-auto ${TOAST_STYLES[toast.type]}`}
            >
              <span className="shrink-0 mt-0.5">{TOAST_ICONS[toast.type]}</span>
              <p className="text-sm font-medium text-text-primary leading-snug flex-grow">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 text-text-secondary hover:text-text-primary transition-colors p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
