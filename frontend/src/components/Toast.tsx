import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: number; type: ToastType; title: string; message?: string; }
interface ToastContextType { toast: (type: ToastType, title: string, message?: string) => void; }

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

const ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const COLORS = {
  success: { bg: 'rgba(14,203,129,0.1)', border: 'rgba(14,203,129,0.35)', icon: '#0ecb81', title: '#0ecb81' },
  error:   { bg: 'rgba(246,70,93,0.1)',  border: 'rgba(246,70,93,0.35)',  icon: '#f6465d', title: '#f6465d' },
  warning: { bg: 'rgba(240,185,11,0.1)', border: 'rgba(240,185,11,0.35)', icon: '#f0b90b', title: '#f0b90b' },
  info:    { bg: 'rgba(0,184,217,0.1)',  border: 'rgba(0,184,217,0.35)',  icon: '#00b8d9', title: '#00b8d9' },
};

let _idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++_idCounter;
    setToasts(p => [...p, { id, type, title, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);

  const dismiss = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 340 }}>
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          const c = COLORS[t.type];
          return (
            <div key={t.id}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl animate-slide-in"
              style={{ background: '#161a1e', border: `1px solid ${c.border}`, minWidth: 260 }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: c.bg }}>
                <Icon size={14} style={{ color: c.icon }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: c.title }}>{t.title}</p>
                {t.message && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#848e9c' }}>{t.message}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="flex-shrink-0 mt-0.5 opacity-50 hover:opacity-100"
                style={{ color: '#848e9c' }}>
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
