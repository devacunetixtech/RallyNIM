import React from 'react';
import { Compass, Sparkles, RefreshCw, Info } from 'lucide-react';
import { CampaignCard } from './CampaignCard';

interface CampaignExplorerProps {
  campaigns: any[];
  loading: boolean;
  onSelectCampaign: (id: string) => void;
  onSeedSampleData: () => void;
}

export const CampaignExplorer: React.FC<CampaignExplorerProps> = ({
  campaigns,
  loading,
  onSelectCampaign,
  onSeedSampleData,
}) => {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Compass size={20} className="text-nimiq-gold" />
            Active Event Campaigns
          </h2>
          <p className="text-sm text-slate-400">
            Attend real-world events, check in to stages, and receive instant Nimiq transfers.
          </p>
        </div>

        {campaigns.length === 0 && (
          <button 
            onClick={onSeedSampleData}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-nimiq-gold to-[#b8831b] hover:shadow-glow text-nimiq-dark px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 pulse-glow"
          >
            <Sparkles size={14} />
            Seed Demo Events
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw size={36} className="animate-spin text-nimiq-gold" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-panel text-center py-12 px-6 flex flex-col items-center">
          <Info size={40} className="text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No campaigns found</h3>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Click "Seed Demo Events" above to instantly load mock hackathons and summits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard 
              key={campaign._id} 
              campaign={campaign} 
              onSelect={onSelectCampaign} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
