import React from 'react';
import { BarChart2, TrendingUp } from 'lucide-react';

interface AnalyticsViewProps {
  claimHistoryLength: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  claimHistoryLength,
}) => {
  return (
    <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-6 shadow-glass">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
        <BarChart2 size={20} className="text-nimiq-gold" />
        Campaign Performance Analytics
      </h3>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-5 rounded-xl transition-colors duration-150">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Escrow Locked</div>
          <div className="text-2xl font-extrabold text-nimiq-gold mt-2">800 NIM</div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            +100% On-Chain Funded
          </div>
        </div>

        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-5 rounded-xl transition-colors duration-150">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Claims Disbursed</div>
          <div className="text-2xl font-extrabold text-slate-200 mt-2">
            {claimHistoryLength * 20} NIM
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Across {claimHistoryLength} successful stage check-ins
          </div>
        </div>
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
