import React, { useState } from 'react';
import { Wallet, RefreshCw, Copy, CheckCheck, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  user: any;
  walletBalance: number;
  walletLoading: boolean;
  selectedRole: 'participant' | 'organizer';
  setSelectedRole: (role: 'participant' | 'organizer') => void;
  onConnect: () => void;
  onDisconnect: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
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
    <header className="sticky top-4 z-40 w-full backdrop-blur-md bg-white/[0.03] dark:bg-slate-900/40 border border-white/5 dark:border-slate-800/40 shadow-lg rounded-2xl py-3 px-6 flex justify-between items-center gap-4 transition-all duration-300">
      {/* Brand Logo and Title */}
      <div className="flex items-center gap-4">
        <img 
          src="/Assets/RallyPrimaryLogo.png" 
          alt="RallyNIM" 
          className="h-10 w-auto object-contain" 
        />
        <div className="hidden md:flex flex-col border-l border-white/10 dark:border-slate-800/50 pl-4">
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">Event Engagement &amp; Escrow Rewards</p>
        </div>
      </div>

      {/* Controller & Theme Toggle */}
      <div className="flex items-center gap-4">
        {/* Theme Switcher */}
        <button 
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-white/5 dark:bg-slate-800/50 border border-white/5 dark:border-slate-800/40 hover:bg-white/10 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all duration-200 active:scale-95"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            {/* Unified Wallet Pill Badge */}
            <div className="flex items-center gap-2.5 bg-white/[0.03] dark:bg-slate-950/20 px-3.5 py-1.5 rounded-full border border-white/5 dark:border-slate-800/30">
              {/* Network Tag */}
              <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                TESTNET
              </span>

              {/* Status Indicator */}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)] animate-pulse" />

              {/* Formatted Address */}
              <span className="text-xs font-mono font-bold text-slate-300 dark:text-slate-400">
                {formatAddress(user.walletAddress || '')}
              </span>

              {/* Copy Button */}
              <button
                onClick={copyAddress}
                title="Copy Address"
                className="p-1 rounded-full hover:bg-white/10 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all active:scale-90"
              >
                {copied
                  ? <CheckCheck size={11} className="text-emerald-400" />
                  : <Copy size={11} />
                }
              </button>

              <div className="w-px h-3 bg-white/10 dark:bg-slate-800/80 mx-1" />

              {/* Balance */}
              <span className="text-xs font-extrabold text-nimiq-gold tabular-nums flex items-center gap-1">
                <Wallet size={11} className="text-nimiq-gold shrink-0" />
                {walletBalance.toFixed(2)} NIM
              </span>
            </div>

            {/* Disconnect */}
            <button 
              onClick={onDisconnect}
              className="bg-white/5 dark:bg-slate-800/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 active:scale-95 text-slate-300 dark:text-slate-400 border border-white/5 dark:border-slate-800/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5 items-center">
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="bg-white/5 dark:bg-slate-800/40 border border-white/5 dark:border-slate-800/40 text-slate-200 dark:text-slate-400 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer outline-none focus:border-nimiq-gold transition-all duration-150"
            >
              <option value="participant">Participant Mode</option>
              <option value="organizer">Organizer Mode</option>
            </select>
            <button 
              onClick={onConnect} 
              disabled={walletLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-nimiq-gold to-blue-600 hover:shadow-lg text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50"
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
