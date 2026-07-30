import React from 'react';
import { User, Award, Flame, Compass, Wallet, RefreshCw } from 'lucide-react';
import { getExplorerUrl } from '../../lib/nimiq';

interface PassportViewProps {
  user: any;
  myPassport: any;
  claimHistory: any[];
  loading: boolean;
}

export const PassportView: React.FC<PassportViewProps> = ({
  user,
  myPassport,
  claimHistory,
  loading,
}) => {
  if (loading || !myPassport) {
    return (
      <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-8 shadow-glass flex flex-col items-center justify-center min-h-[300px] animate-pulse">
        <RefreshCw size={36} className="animate-spin text-nimiq-gold mb-3" />
        <span className="text-xs text-slate-400 font-medium">Fetching developer passport data...</span>
      </div>
    );
  }
  return (
    <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-6 shadow-glass">
      
      {/* Passport Profile Header */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-5 mb-6 flex-wrap">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nimiq-gold to-[#163da1] flex items-center justify-center shrink-0">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Event Attendance Passport</h3>
          <p className="text-xs text-slate-400 font-mono select-all break-all max-w-lg mt-1">
            Wallet: {user?.walletAddress}
          </p>
        </div>
      </div>

      {/* Passport Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-4 rounded-xl text-center transition-colors duration-150">
          <Award size={24} className="text-nimiq-gold mx-auto mb-2" />
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Rewards</div>
          <div className="text-xl font-extrabold text-nimiq-gold mt-1">
            {myPassport ? myPassport.totalNIMEarned : 0} NIM
          </div>
          <div className="text-[9px] text-slate-400 mt-2 leading-tight">
            Sent directly on-chain to connected wallet
          </div>
        </div>

        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-4 rounded-xl text-center transition-colors duration-150">
          <Flame size={24} className="text-[#e65100] mx-auto mb-2 animate-bounce" />
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Streak</div>
          <div className="text-xl font-extrabold text-[#e65100] mt-1">
            {myPassport ? myPassport.streak : 0} Check-ins
          </div>
        </div>

        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-4 rounded-xl text-center transition-colors duration-150">
          <Compass size={24} className="text-sky-400 mx-auto mb-2" />
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Events Attended</div>
          <div className="text-xl font-extrabold text-slate-200 mt-1">
            {myPassport ? myPassport.eventsAttended.length : 0}
          </div>
        </div>
      </div>

      {/* Badges Collection */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
          <Award size={15} className="text-nimiq-gold" />
          Earned Badges
        </h4>
        {myPassport && myPassport.badges && myPassport.badges.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {myPassport.badges.map((badge: string, i: number) => (
              <span key={i} className="text-xs font-bold text-nimiq-gold bg-nimiq-gold/10 border border-nimiq-gold/20 px-3.5 py-1.5 rounded-xl">
                🌟 {badge}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Complete campaign stages to unlock specialized attendance badges.</p>
        )}
      </div>

      {/* Achievements Log */}
      <div>
        <h4 className="text-sm font-bold text-slate-200 mb-3">Activity Log</h4>
        {myPassport && myPassport.achievements && myPassport.achievements.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {myPassport.achievements.map((ach: any, i: number) => (
              <div 
                key={i} 
                className="bg-white/[0.005] hover:bg-white/[0.01] border border-white/5 p-3 rounded-lg flex justify-between items-center transition-colors duration-150"
              >
                <div>
                  <div className="text-xs font-bold text-slate-300">{ach.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{ach.description}</div>
                </div>
                <div className="text-[10px] text-slate-600 font-medium font-mono shrink-0">
                  {new Date(ach.unlockedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No recent activity records.</p>
        )}
      </div>

      {/* Payout History */}
      <div className="mt-6 border-t border-white/5 pt-6">
        <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
          <Wallet size={15} className="text-nimiq-gold" />
          Reward Payout History
        </h4>
        {claimHistory && claimHistory.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {claimHistory.map((claim: any, i: number) => (
              <div 
                key={i} 
                className="bg-white/[0.005] hover:bg-white/[0.01] border border-white/5 p-3 rounded-lg flex justify-between items-center transition-colors duration-150"
              >
                <div>
                  <div className="text-xs font-bold text-slate-300">
                    {claim.stageId?.title || 'Claim Reward'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Campaign: {claim.campaignId?.title || 'Unknown'}
                  </div>
                  {claim.transactionHash && (
                    <a
                      href={getExplorerUrl(claim.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-sky-400 hover:text-sky-300 underline font-mono block mt-1"
                    >
                      Tx: {claim.transactionHash.slice(0, 10)}···{claim.transactionHash.slice(-8)}
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs font-extrabold text-nimiq-gold">
                    +{claim.reward} NIM
                  </span>
                  <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    claim.status === 'completed' || claim.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : claim.status === 'failed'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      claim.status === 'completed' || claim.status === 'success'
                        ? 'bg-emerald-400'
                        : claim.status === 'failed'
                        ? 'bg-red-400'
                        : 'bg-amber-400'
                    }`} />
                    {claim.status === 'completed' || claim.status === 'success' ? 'Delivered' : claim.status === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No payout transactions recorded yet.</p>
        )}
      </div>
    </div>
  );
};
