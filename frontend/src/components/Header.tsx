import React, { useState } from 'react';
import { Wallet, RefreshCw, Copy, CheckCheck } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  user: any;
  walletBalance: number;
  walletLoading: boolean;
  selectedRole: 'participant' | 'organizer';
  setSelectedRole: (role: 'participant' | 'organizer') => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

/** Formats a Nimiq address as "NQ12 · · · AB CD" keeping first & last 4 chars of each group */
function formatAddress(addr: string): string {
  if (!addr) return '';
  const clean = addr.replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 6)}···${clean.slice(-4)}`;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  user,
  walletBalance,
  walletLoading,
  selectedRole,
  setSelectedRole,
  onConnect,
  onDisconnect,
}) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!user?.walletAddress) return;
    navigator.clipboard.writeText(user.walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center mb-6 py-4 border-b border-white/5 gap-4">
      {/* Brand Logo and Title */}
      <div className="flex items-center gap-4">
        <img 
          src="/Assets/RallyPrimaryLogo.png" 
          alt="RallyNIM" 
          className="h-11 w-auto object-contain" 
        />
        <div className="flex flex-col">
          <span className="w-fit bg-nimiq-gold/15 border border-nimiq-gold/30 text-nimiq-gold px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
            TESTNET
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Event Engagement &amp; Escrow Rewards</p>
        </div>
      </div>

      {/* Wallet / Session Controller */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex flex-wrap items-center gap-3 bg-white/[0.03] px-3 py-2 rounded-xl border border-white/8 shadow-inner">
            
            {/* Connected indicator dot + role label */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)] animate-pulse" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {user.role}
              </span>
            </div>

            <div className="w-px h-5 bg-white/10" />

            {/* Address + copy */}
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col items-start">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold leading-none mb-0.5">
                  Wallet
                </span>
                <span className="text-xs font-mono font-semibold text-slate-200 tracking-wide">
                  {formatAddress(user.walletAddress || '')}
                </span>
              </div>
              <button
                onClick={copyAddress}
                title="Copy full address"
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all active:scale-90"
              >
                {copied
                  ? <CheckCheck size={12} className="text-emerald-400" />
                  : <Copy size={12} />
                }
              </button>
            </div>

            <div className="w-px h-5 bg-white/10" />

            {/* Balance */}
            <div className="flex items-center gap-1.5">
              <Wallet size={13} className="text-nimiq-gold" />
              <span className="text-sm font-bold text-nimiq-gold tabular-nums">
                {walletBalance.toFixed(2)} NIM
              </span>
            </div>

            <div className="w-px h-5 bg-white/10" />

            {/* Disconnect */}
            <button 
              onClick={onDisconnect}
              className="bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 active:scale-95 text-slate-300 border border-white/5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="bg-nimiq-dark border border-white/10 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer outline-none focus:border-nimiq-gold"
            >
              <option value="participant">Participant Mode</option>
              <option value="organizer">Organizer Mode</option>
            </select>
            <button 
              onClick={onConnect} 
              disabled={walletLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-nimiq-gold to-[#163da1] hover:shadow-glow text-white px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {walletLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Wallet size={14} />
              )}
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

