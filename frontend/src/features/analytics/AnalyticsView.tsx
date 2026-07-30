import React from 'react';
import { BarChart2, TrendingUp, Wallet, ArrowUpRight, RefreshCw } from 'lucide-react';
import { getExplorerUrl } from '../../lib/nimiq';

interface AnalyticsViewProps {
  claimHistory: any[];
  campaigns: any[];
  organizerId: string;
  loading: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  claimHistory,
  campaigns,
  organizerId,
  loading,
}) => {
  if (loading) {
    return (
      <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-8 shadow-glass flex flex-col items-center justify-center min-h-[300px] animate-pulse">
        <RefreshCw size={36} className="animate-spin text-nimiq-gold mb-3" />
        <span className="text-xs text-slate-400 font-medium">Loading campaign analytics...</span>
      </div>
    );
  }

  // Filter campaigns created by this organizer
  const myCampaigns = campaigns.filter((c) => {
    const org = c.organizer || c.organizerId;
    const orgId = typeof org === 'object' ? org?._id : org;
    return orgId === organizerId;
  });
  const myCampaignIds = myCampaigns.map((c) => c._id);

  // Filter claims belonging to organizer campaigns
  const myClaims = claimHistory.filter((claim) => {
    const cid = claim.campaignId?._id || claim.campaignId;
    return myCampaignIds.includes(cid);
  });

  // Aggregate total volume paid out from campaigns
  const totalVolume = myClaims
    .filter((c) => c.status === 'completed' || c.status === 'success')
    .reduce((sum, c) => sum + c.reward, 0);

  // Live total remaining escrow (NIM balance left locked in organizer's campaigns)
  const remainingEscrow = myCampaigns.reduce((sum, c) => sum + (c.remainingPool || 0), 0);

  return (
    <div className="space-y-6">
      {/* Analytics Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Escrow Remaining */}
        <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-5 shadow-glass relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Active Escrow</p>
              <h3 className="text-2xl font-black text-nimiq-gold mt-1.5 font-mono">{remainingEscrow.toLocaleString()} NIM</h3>
            </div>
            <div className="p-2 bg-nimiq-gold/10 text-nimiq-gold border border-nimiq-gold/20 rounded-xl">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-4 leading-relaxed">
            Live NIM remaining across all your active event campaigns
          </p>
        </div>

        {/* Total Volume Disbursed */}
        <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-5 shadow-glass relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Disbursed Rewards</p>
              <h3 className="text-2xl font-black text-slate-200 mt-1.5 font-mono">{totalVolume.toLocaleString()} NIM</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-4 leading-relaxed">
            Aggregate amount successfully paid out to check-in attendees
          </p>
        </div>

        {/* Total Check-in Claims */}
        <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-5 shadow-glass relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Check-ins</p>
              <h3 className="text-2xl font-black text-slate-200 mt-1.5 font-mono">{myClaims.length}</h3>
            </div>
            <div className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
              <BarChart2 size={16} />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-4 leading-relaxed">
            Number of stage check-ins submitted across your campaigns
          </p>
        </div>
      </div>

      {/* Disbursed Payout History Section */}
      <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-6 shadow-glass">
        <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5">
          <TrendingUp size={15} className="text-nimiq-gold" />
          Disbursed Payouts History
        </h4>
        {myClaims.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {myClaims.map((claim: any, i: number) => (
              <div 
                key={i} 
                className="bg-white/[0.005] hover:bg-white/[0.01] border border-white/5 p-3.5 rounded-xl flex justify-between items-center transition-colors duration-150"
              >
                <div>
                  <div className="text-xs font-bold text-slate-300">
                    {claim.stageId?.title || 'Stage Claim'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Campaign: {claim.campaignId?.title || 'Unknown'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    To: {claim.walletAddress.toUpperCase().replace(/(.{4})/g, '$1 ')}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="font-extrabold text-nimiq-gold">
                    -{claim.reward} NIM
                  </span>
                  <div className="flex items-center gap-2">
                    {claim.transactionHash && (
                      <a
                        href={getExplorerUrl(claim.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
                      >
                        Tx <ArrowUpRight size={10} />
                      </a>
                    )}
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
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No payout transactions generated yet.</p>
        )}
      </div>

      {/* Verification Breakdown */}
      <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-6 shadow-glass">
        <h4 className="text-xs font-bold text-slate-300 mb-4 uppercase tracking-wider">Verification Method Utilization</h4>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Dynamic HMAC QR Code</span>
              <span className="font-bold text-nimiq-gold">75%</span>
            </div>
            <div className="bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-nimiq-gold h-full rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Developer Proximity Quiz</span>
              <span className="font-bold text-sky-400">20%</span>
            </div>
            <div className="bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Secret Key Word</span>
              <span className="font-bold text-[#e65100]">5%</span>
            </div>
            <div className="bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-[#e65100] h-full rounded-full" style={{ width: '5%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
