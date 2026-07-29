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
  return (
    <header className="flex flex-col sm:flex-row justify-between items-center mb-6 py-4 border-b border-white/5 gap-4">
      {/* Brand Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-nimiq-gold to-[#b8831b] w-10 h-10 rounded-xl flex items-center justify-center shadow-glow">
          <Sparkles size={22} className="text-nimiq-dark" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 tracking-tight">
            Rally<span className="text-nimiq-gold">NIM</span>
            <span className="bg-nimiq-gold/15 border border-nimiq-gold/30 text-nimiq-gold px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              TESTNET
            </span>
          </h1>
          <p className="text-xs text-slate-400">Event Engagement & Escrow Rewards</p>
        </div>
      </div>

      {/* Wallet / Session Controller */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] p-2 pr-3 pl-3 rounded-xl border border-white/5 shadow-inner">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {user.role} wallet
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
              className="flex items-center gap-2 bg-gradient-to-r from-nimiq-gold to-[#b8831b] hover:shadow-glow text-nimiq-dark px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50"
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
