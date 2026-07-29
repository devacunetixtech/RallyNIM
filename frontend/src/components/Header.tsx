import React from 'react';
import { Wallet, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  user: any;
  walletBalance: number;
  walletLoading: boolean;
  selectedRole: 'participant' | 'organizer';
  setSelectedRole: (role: 'participant' | 'organizer') => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isMock: boolean;
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
  isMock,
}) => {
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
          <p className="text-[10px] text-slate-400 mt-1">Event Engagement & Escrow Rewards</p>
        </div>
      </div>

      {/* Wallet / Session Controller */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] p-2 pr-3 pl-3 rounded-xl border border-white/5 shadow-inner">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-end gap-1.5">
                {user.role} wallet
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${isMock ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {isMock ? 'Mock' : 'Live'}
                </span>
              </div>
              <div className="text-sm font-bold text-nimiq-gold">
                {walletBalance.toFixed(2)} NIM
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-nimiq-gold/10 flex items-center justify-center">
              <Wallet size={15} className="text-nimiq-gold" />
            </div>
            <button 
              onClick={onDisconnect}
              className="bg-white/5 hover:bg-white/10 active:scale-95 text-slate-200 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
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
