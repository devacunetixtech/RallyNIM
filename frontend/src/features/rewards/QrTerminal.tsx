import React from 'react';
import { QrCode, RefreshCw } from 'lucide-react';

interface QrTerminalProps {
  stageId: string;
  token: string | null;
  countdown: number;
  onClose: () => void;
}

export const QrTerminal: React.FC<QrTerminalProps> = ({
  stageId,
  token,
  countdown,
  onClose,
}) => {
  return (
    <div className="glass-panel border-2 border-nimiq-gold bg-[#0A0D14] p-6 text-center rounded-2xl relative my-6 shadow-glass max-w-sm mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <QrCode className="text-nimiq-gold" size={20} />
          <h4 className="text-sm font-bold text-slate-200">Presenter Display Terminal</h4>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-xl font-black cursor-pointer leading-none p-1"
        >
          &times;
        </button>
      </div>

      <div className="bg-white p-3 inline-block rounded-2xl mb-4 shadow-lg border border-slate-200/80">
        {token ? (
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(token)}&color=000000&bgcolor=ffffff&qzone=1`} 
            alt="Dynamic Stage Verification QR Code"
            className="w-44 h-44 select-none pointer-events-none rounded-lg"
          />
        ) : (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-[10px] font-bold rounded-xl gap-2">
            <RefreshCw size={20} className="animate-spin text-nimiq-gold" />
            Generating dynamic QR...
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mb-3 bg-white/5 py-1.5 px-3 rounded-xl w-fit mx-auto border border-white/5">
        <RefreshCw size={12} className="text-nimiq-gold animate-spin" style={{ animationDuration: '4s' }} />
        <span className="text-xs text-slate-300 font-medium">
          Regenerating signature in <strong className="text-nimiq-gold font-mono font-bold">{countdown}s</strong>
        </span>
      </div>
      
      {token && (
        <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl font-mono text-[9px] text-slate-400 break-all select-all">
          {token}
        </div>
      )}
      <p className="text-[9px] text-slate-500 mt-3 leading-normal">
        This HMAC signature dynamically rotates to establish attendee real-time proximity and prevent screenshot double-claims.
      </p>
    </div>
  );
};
