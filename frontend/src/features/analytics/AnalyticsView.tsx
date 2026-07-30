import React from 'react';
import { BarChart2, TrendingUp, Wallet, ArrowUpRight, RefreshCw } from 'lucide-react';

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
        <span className="text-xs text-slate-400 font-medium">Fetching campaign analytics...</span>
      </div>
    );
  }

  const claimHistoryLength = claimHistory.length;
  const totalClaimsDisbursed = claimHistory.reduce((acc, c) => acc + (c.reward || 0), 0);

  // Filter campaigns created by this organizer
  const organizerCampaigns = campaigns.filter(
    (c) => c.organizer === organizerId || c.organizer?._id === organizerId
  );
  
  // Total NIM remaining in campaigns (locked in escrow)
  const totalEscrowLocked = organizerCampaigns.reduce(
    (acc, c) => acc + (c.remainingPool || 0),
    0
  );

  return (
    <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-6 shadow-glass animate-fade-in">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
        <BarChart2 size={20} className="text-nimiq-gold" />
        Campaign Performance Analytics
      </h3>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-5 rounded-xl transition-colors duration-150">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Escrow Locked</div>
          <div className="text-2xl font-extrabold text-nimiq-gold mt-2">{totalEscrowLocked} NIM</div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            +100% On-Chain Funded
          </div>
        </div>

        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-5 rounded-xl transition-colors duration-150">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Claims Disbursed</div>
          <div className="text-2xl font-extrabold text-slate-200 mt-2">
            {totalClaimsDisbursed} NIM
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Across {claimHistoryLength} successful stage check-ins
          </div>
        </div>
      </div>

      {/* Organizer Payout History */}
      <div className="bg-white/[0.005] border border-white/5 p-5 rounded-xl mb-6">
        <h4 className="text-xs font-bold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-1.5">
          <Wallet size={14} className="text-nimiq-gold" />
          Disbursed Payout History
        </h4>
        
        {claimHistory && claimHistory.length > 0 ? (
          <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
            {claimHistory.map((claim: any, i: number) => (
              <div 
                key={i} 
                className="bg-white/[0.005] border border-white/5 p-3 rounded-lg flex justify-between items-center text-xs"
              >
                <div>
                  <div className="text-slate-300 font-semibold">
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
                        href={`https://testnet.nimiq.watch/#/transaction/${claim.transactionHash}`}
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
      <div className="bg-white/[0.005] border border-white/5 p-5 rounded-xl">
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
