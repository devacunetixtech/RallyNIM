import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Play, Users, Award, ExternalLink, Zap, Compass, MapPin } from 'lucide-react';

interface HomeViewProps {
  onStartExploring: () => void;
  network: string;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartExploring, network }) => {
  const [stats, setStats] = useState<{
    totalParticipants: number;
    totalClaimed: number;
    recentClaims: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.rewards.getPublicStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch public stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll statistics every 5 seconds for a real-time experience
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const explorerUrl = (hash: string) => {
    return network === 'mainnet'
      ? `https://nimiq.watch/#${hash}`
      : `https://nimiq.watch/#${hash}`; // Nimiq Watch handles testnet transactions if network prefix/parameters are parsed or simply via watch hashes.
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    const clean = addr.replace(/\s+/g, '');
    return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
  };

  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-nimiq-gold/20 via-sky-500/10 to-transparent border border-white/5 p-8 md:p-12 shadow-glass">
        <div className="max-w-2xl space-y-6">
          <span className="text-[10px] font-black tracking-widest uppercase bg-nimiq-gold/15 text-nimiq-gold border border-nimiq-gold/20 px-3 py-1 rounded-full">
            Powered by Nimiq Pay
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-100 to-nimiq-gold tracking-tight leading-tight">
            RallyNIM: Real-time Web3 Engagement Campaigns
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            Create and participate in interactive event quests. Claim instant Nimiq reward payouts verified through geofencing, dynamic QR scanner handshakes, and on-session quizzes.
          </p>
          <div className="pt-2">
            <button
              onClick={onStartExploring}
              className="flex items-center gap-2 bg-gradient-to-r from-nimiq-gold to-amber-500 hover:from-nimiq-gold/90 hover:to-amber-500/90 text-slate-950 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-150 hover:shadow-[0_0_20px_rgba(252,192,20,0.4)] active:scale-95"
            >
              <Play size={16} fill="currentColor" />
              Explore Active Quests
            </button>
          </div>
        </div>
      </div>

      {/* Feature Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01] rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-nimiq-gold/10 flex items-center justify-center text-nimiq-gold border border-nimiq-gold/20">
            <Zap size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-200">Instant Escrow Payouts</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Organizers lock reward pools inside a verified escrow hot wallet. Payouts transfer directly and trustlessly to your Nimiq Pay wallet.
          </p>
        </div>

        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01] rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
            <MapPin size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-200">Location Verifications</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatic geolocation boundaries enforce that users are physically present at event booths and venues to claim incentives.
          </p>
        </div>

        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01] rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Compass size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-200">Sequential Milestones</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Complete tasks in sequential order. Build verified user footprints on-chain as you participate in dev sessions and event tracks.
          </p>
        </div>
      </div>

      {/* Live Engagement Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Stats Counter Cards */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Award className="text-nimiq-gold" size={20} />
            Global Activity
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Total Engaged Participants */}
            <div className="glass-panel bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Engaged Wallets</span>
                <span className="text-3xl font-extrabold text-slate-200">
                  {loading ? '...' : stats?.totalParticipants || 0}
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-nimiq-gold/10 flex items-center justify-center text-nimiq-gold border border-nimiq-gold/25">
                <Users size={22} />
              </div>
            </div>

            {/* Total NIM Claimed */}
            <div className="glass-panel bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Claims Distributed</span>
                <span className="text-3xl font-extrabold text-nimiq-gold">
                  {loading ? '...' : `${stats?.totalClaimed || 0} NIM`}
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/25">
                <Award size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Real-time Claims Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Real-time Engagement Feed
            </h2>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Auto-refreshing live
            </span>
          </div>

          <div className="glass-panel bg-white/[0.005] border border-white/5 rounded-2xl overflow-hidden p-4 max-h-[350px] overflow-y-auto space-y-3 custom-scrollbar">
            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                Loading live engagement data...
              </div>
            ) : stats?.recentClaims.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                No rewards claimed yet. Explore quests and claim the first reward!
              </div>
            ) : (
              stats?.recentClaims.map((claim) => (
                <div
                  key={claim._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] p-3 rounded-xl gap-3 transition-colors duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded">
                        {truncateAddress(claim.walletAddress)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        completed stage
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {claim.stageId?.title || 'Unknown Stage'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Campaign: <span className="font-semibold text-slate-400">{claim.campaignId?.title || 'Unknown Event'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                    <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">
                      +{claim.reward} NIM
                    </span>
                    {claim.transactionHash ? (
                      <a
                        href={explorerUrl(claim.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded"
                      >
                        <ExternalLink size={10} />
                        {truncateHash(claim.transactionHash)}
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-600 italic">No Hash</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
