import React from 'react';
import { Compass, RefreshCw, Info } from 'lucide-react';
import { CampaignCard } from './CampaignCard';

interface CampaignExplorerProps {
  campaigns: any[];
  loading: boolean;
  onSelectCampaign: (id: string) => void;
}

export const CampaignExplorer: React.FC<CampaignExplorerProps> = ({
  campaigns,
  loading,
  onSelectCampaign,
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
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw size={36} className="animate-spin text-nimiq-gold" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-panel text-center py-12 px-6 flex flex-col items-center">
          <Info size={40} className="text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No campaigns found</h3>
          <p className="text-sm text-slate-400 max-w-md">
            There are currently no active campaigns. Please check back later.
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
