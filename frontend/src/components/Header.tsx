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
    <header className="sticky top-4 z-40 w-full backdrop-blur-md bg-white/[0.03] dark:bg-slate-900/40 border border-white/5 dark:border-slate-800/40 shadow-lg rounded-2xl py-3 px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300">
      {/* Brand Logo and Title */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 md:h-22 lg:h-24 flex items-center">
            <img
              src="/Assets/RallyAppIcon.png"
              alt="RallyNIM"
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="hidden lg:flex flex-col border-l border-white/10 dark:border-slate-800/50 pl-4">
            <p className="text-[13px] text-slate-400 font-medium tracking-wide">Event Engagement &amp; Escrow Rewards</p>
          </div>
        </div>
        
        {/* Mobile-only Theme Switcher to align cleanly on very small screens */}
        <button 
          onClick={onToggleTheme}
          className="md:hidden p-2 rounded-xl bg-white/5 dark:bg-slate-800/50 border border-white/5 dark:border-slate-800/40 hover:bg-white/10 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all duration-200"
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
        </button>
      </div>

      {/* Controls & Wallet Section */}
      <div className="flex items-center justify-center md:justify-end w-full md:w-auto gap-3 flex-wrap">
        {/* Desktop Theme Switcher */}
        <button 
          onClick={onToggleTheme}
          className="hidden md:block p-2 rounded-xl bg-white/5 dark:bg-slate-800/50 border border-white/5 dark:border-slate-800/40 hover:bg-white/10 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all duration-200 active:scale-95"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-center md:justify-end">
            {/* Unified Wallet Pill Badge */}
            <div className="flex items-center gap-2 bg-white/[0.03] dark:bg-slate-950/20 px-3.5 py-1.5 rounded-full border border-white/5 dark:border-slate-800/30 flex-1 md:flex-none justify-center">
              {/* Network Tag - Hidden on mobile screens */}
              <span className={`hidden sm:inline-block text-[8px] sm:text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${
                import.meta.env.VITE_NETWORK === 'mainnet'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                {import.meta.env.VITE_NETWORK === 'mainnet' ? 'MAINNET' : 'TESTNET'}
              </span>

              {/* Status Indicator */}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)] animate-pulse shrink-0" />

              {/* Formatted Address (Clickable to copy) */}
              <span 
                onClick={copyAddress}
                className="text-xs font-mono font-bold text-slate-300 dark:text-slate-400 cursor-pointer hover:text-nimiq-gold transition-colors duration-150 select-all"
                title="Click to copy address"
              >
                {formatAddress(user.walletAddress || '')}
              </span>

              {/* Copy Button icon - Hidden on mobile */}
              <button
                onClick={copyAddress}
                title="Copy Address"
                className="hidden sm:inline-block p-0.5 rounded-full hover:bg-white/10 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              >
                {copied
                  ? <CheckCheck size={11} className="text-emerald-400" />
                  : <Copy size={11} />
                }
              </button>

              <div className="w-px h-3 bg-white/10 dark:bg-slate-800/80 mx-1 shrink-0" />

              {/* Balance */}
              <span className="text-xs font-extrabold text-nimiq-gold tabular-nums flex items-center gap-1 shrink-0">
                <Wallet size={11} className="text-nimiq-gold shrink-0" />
                {walletBalance.toFixed(2)} NIM
              </span>
            </div>

            {/* Disconnect */}
            <button 
              onClick={onDisconnect}
              className="bg-white/5 dark:bg-slate-800/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 active:scale-95 text-slate-300 dark:text-slate-400 border border-white/5 dark:border-slate-800/40 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5 items-center w-full md:w-auto justify-center md:justify-end flex-wrap sm:flex-nowrap">
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="bg-white/5 dark:bg-slate-800/40 border border-white/5 dark:border-slate-800/40 text-slate-200 dark:text-slate-400 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer outline-none focus:border-nimiq-gold transition-all duration-150 flex-1 md:flex-none"
            >
              <option value="participant">Participant Mode</option>
              <option value="organizer">Organizer Mode</option>
            </select>
            <button 
              onClick={onConnect} 
              disabled={walletLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-nimiq-gold to-blue-600 hover:shadow-lg text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 flex-1 md:flex-none justify-center shrink-0"
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
