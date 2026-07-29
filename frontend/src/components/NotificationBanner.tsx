import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

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
  // Auto-dismiss success banner after 3 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      onClearSuccess?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  return (
    <>
      {errorMessage && (
        <div 
          onClick={onClearError}
          className="flex items-center gap-3 p-4 rounded-xl mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-400 cursor-pointer animate-fadeIn"
        >
          <AlertCircle size={20} className="shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div 
          onClick={onClearSuccess}
          className="flex items-center gap-3 p-4 rounded-xl mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-pointer animate-fadeIn"
        >
          <CheckCircle size={20} className="shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}
    </>
  );
};
