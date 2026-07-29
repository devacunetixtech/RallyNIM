import React from 'react';
import { QrCode } from 'lucide-react';

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
    <div className="glass-panel pulse-glow border-2 border-nimiq-gold bg-[#0a0d16] p-6 text-center rounded-2xl relative my-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <QrCode className="text-nimiq-gold" size={20} />
          <h4 className="text-sm font-bold text-slate-200">Presenter Display Terminal</h4>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-xl font-bold cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div className="bg-white p-4 inline-block rounded-xl mb-3 shadow-glass">
        {/* Simulated visual QR structure */}
        <div className="w-40 h-40 border-[3px] border-black flex flex-wrap p-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <div 
              key={i} 
              className="w-10 h-10 transition-colors duration-200"
              style={{ 
                background: (i % 3 === 0 || i === 0 || i === 12 || i === 15 || (countdown % 2 === 0 && i % 2 === 0)) ? '#000' : '#fff' 
              }}
            ></div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-2">
        Regenerating in <strong className="text-nimiq-gold">{countdown}s</strong>
      </p>
      
      {token && (
        <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-lg font-mono text-[10px] text-slate-300 break-all select-all">
          {token}
        </div>
      )}
      <p className="text-[10px] text-slate-500 mt-2">
        HMAC signature validates attendee proximity, preventing screenshot double-claims.
      </p>
    </div>
  );
};
