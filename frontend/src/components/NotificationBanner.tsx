import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBannerProps {
  errorMessage: string | null;
  successMessage: string | null;
  onClearError?: () => void;
  onClearSuccess?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  errorMessage,
  successMessage,
  onClearError,
  onClearSuccess,
}) => {
  // Auto-dismiss success banner after 4 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      onClearSuccess?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage, onClearSuccess]);

  // Auto-dismiss error banner after 6 seconds
  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => {
      onClearError?.();
    }, 6005);
    return () => clearTimeout(timer);
  }, [errorMessage, onClearError]);

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={onClearError}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 dark:bg-slate-950/95 border border-rose-500/30 shadow-[0_8px_32px_rgba(244,63,94,0.15)] backdrop-blur-md text-rose-400 cursor-pointer"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-100 mb-0.5">Execution Error</div>
              <p className="text-[11px] text-slate-400 font-medium leading-normal">{errorMessage}</p>
            </div>
            <button className="text-slate-500 hover:text-slate-300">
              <X size={14} />
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={onClearSuccess}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 dark:bg-slate-950/95 border border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.15)] backdrop-blur-md text-emerald-400 cursor-pointer"
          >
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-100 mb-0.5">Transaction Successful</div>
              <p className="text-[11px] text-slate-400 font-medium leading-normal">{successMessage}</p>
            </div>
            <button className="text-slate-500 hover:text-slate-300">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
