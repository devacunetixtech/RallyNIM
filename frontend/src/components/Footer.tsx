import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  escrowAddress?: string;
}

export const Footer: React.FC<FooterProps> = ({
  escrowAddress = 'NQ34 G6XF HT9Y SMQ2 YS1X U29D E91X 557U F31P'
}) => {
  return (
    <footer className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-emerald-500" />
        <span className="font-semibold text-slate-400">HMAC Replay Protection Enabled</span>
      </div>
      <div className="flex items-center gap-2">
        <span>Hot Wallet Escrow Address:</span>
        <span className="font-mono bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded text-slate-400 select-all">
          {escrowAddress}
        </span>
      </div>
    </footer>
  );
};
