import React from 'react';
import { MapPin } from 'lucide-react';

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

  return (
    <div 
      onClick={() => onSelect(campaign._id)}
      className="glass-panel interactive-card group cursor-pointer flex flex-col justify-between h-full hover:scale-[1.01] transition-transform duration-200"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
            {campaign.category}
          </span>
          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
            campaign.status === 'live' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
          }`}>
            {campaign.status}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-slate-100 group-hover:text-nimiq-gold transition-colors duration-200 mb-2">
          {campaign.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-3 mb-4">
          {campaign.description}
        </p>
      </div>

      <div className="border-t border-white/5 pt-3 mt-3">
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <MapPin size={13} className="text-nimiq-gold" />
            {campaign.location}
          </span>
          <span className="text-nimiq-gold font-bold">
            Pool: {campaign.remainingPool} NIM
          </span>
        </div>
        <div className="bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div 
            style={{ width: `${percentageRemaining}%` }} 
            className="bg-nimiq-gold h-full rounded-full transition-all duration-300"
          ></div>
        </div>
      </div>
    </div>
  );
};
