import React from 'react';
import { MapPin, Coins } from 'lucide-react';

interface CampaignCardProps {
  campaign: any;
  onSelect: (id: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onSelect,
}) => {
  const percentageRemaining = campaign.rewardPool > 0 
    ? (campaign.remainingPool / campaign.rewardPool) * 100 
    : 0;

  const isLive = campaign.status === 'live';

  return (
    <div 
      onClick={() => onSelect(campaign._id)}
      className="glass-panel group cursor-pointer flex flex-col justify-between h-full hover:scale-[1.01] hover:border-nimiq-gold/30 hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden"
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-nimiq-gold/10 text-nimiq-gold border border-nimiq-gold/20">
            {campaign.category}
          </span>
          <span className={`flex items-center gap-1.5 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${
            isLive 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isLive ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]' : 'bg-amber-400'
            }`} />
            {campaign.status}
          </span>
        </div>
        
        <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 group-hover:text-nimiq-gold transition-colors duration-200 mb-2 font-sans tracking-tight">
          {campaign.title}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
          {campaign.description}
        </p>
      </div>

      <div className="border-t border-white/5 pt-3.5 mt-3">
        <div className="flex justify-between items-center mb-2.5 text-[11px]">
          <span className="text-slate-500 flex items-center gap-1">
            <MapPin size={12} className="text-slate-400" />
            {campaign.location}
          </span>
          <span className="flex items-center gap-1 bg-nimiq-gold/10 text-nimiq-gold border border-nimiq-gold/20 font-black px-2 py-0.5 rounded-md">
            <Coins size={11} />
            Pool: {campaign.remainingPool} NIM
          </span>
        </div>
        <div className="bg-white/5 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            style={{ width: `${percentageRemaining}%` }} 
            className="bg-nimiq-gold h-full rounded-full transition-all duration-300"
          ></div>
        </div>
      </div>
    </div>
  );
};
