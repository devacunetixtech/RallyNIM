import React, { useState } from 'react';
import { PlusCircle, HelpCircle, Navigation, Loader2 } from 'lucide-react';

interface CampaignCreatorProps {
  newCampaign: {
    title: string;
    description: string;
    category: string;
    rewardPool: number;
    startDate: string;
    endDate: string;
    location: string;
    latitude?: number;
    longitude?: number;
  };
  setNewCampaign: React.Dispatch<React.SetStateAction<any>>;
  newStages: any[];
  setNewStages: React.Dispatch<React.SetStateAction<any[]>>;
  onCreateCampaign: (e: React.FormEvent) => void;
  loading: boolean;
}

export const CampaignCreator: React.FC<CampaignCreatorProps> = ({
  newCampaign,
  setNewCampaign,
  newStages,
  setNewStages,
  onCreateCampaign,
  loading,
}) => {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const fetchCoordinates = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewCampaign((prev: any) => ({
          ...prev,
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
        }));
        setGpsLoading(false);
      },
      (error) => {
        setGpsError("Failed to lock GPS. Make sure location permissions are enabled.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const addStage = () => {
    setNewStages(prev => [
      ...prev,
      { 
        title: 'New Event Stage', 
        description: 'Detail verification challenge steps here.', 
        rewardType: 'fixed', 
        rewardAmount: 10, 
        verificationMethod: 'dynamic_qr', 
        maximumClaims: 100 
      }
    ]);
  };

  const removeStage = (idx: number) => {
    setNewStages(prev => prev.filter((_, i) => i !== idx));
  };

  const updateStageField = (idx: number, field: string, val: any) => {
    const updated = [...newStages];
    updated[idx][field] = val;
    setNewStages(updated);
  };

  return (
    <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-6 shadow-glass">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
        <PlusCircle size={20} className="text-nimiq-gold" />
        Deploy Escrow Reward Campaign
      </h3>

      <form onSubmit={onCreateCampaign} className="space-y-4">
        
        {/* Campaign Title */}
        <div className="form-group">
          <label className="form-label text-xs">Campaign Title</label>
          <input 
            type="text" 
            className="form-input py-2.5 px-4 text-sm" 
            placeholder="e.g. Nimiq Builders Hackathon" 
            value={newCampaign.title}
            onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        {/* Campaign Description */}
        <div className="form-group">
          <label className="form-label text-xs">Description</label>
          <textarea 
            className="form-input py-2.5 px-4 text-sm" 
            rows={3} 
            placeholder="Explain campaign details, check-in requirements, and reward guidelines..." 
            value={newCampaign.description}
            onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, description: e.target.value }))}
            style={{ resize: 'vertical' }}
            required
          />
        </div>

        {/* Category & Reward Pool */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label text-xs">Category</label>
            <select 
              className="form-input py-2.5 px-4 text-sm cursor-pointer"
              value={newCampaign.category}
              onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, category: e.target.value }))}
            >
              <option value="Conference">Conference</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Summit">Summit</option>
              <option value="Meetup">Meetup</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label text-xs">Reward Pool (NIM)</label>
            <input 
              type="number" 
              className="form-input py-2.5 px-4 text-sm" 
              value={newCampaign.rewardPool}
              onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, rewardPool: parseInt(e.target.value, 10) || 0 }))}
              required
              min={1}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label text-xs">Start Date</label>
            <input 
              type="date" 
              className="form-input py-2.5 px-4 text-sm" 
              value={newCampaign.startDate}
              onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label text-xs">End Date</label>
            <input 
              type="date" 
              className="form-input py-2.5 px-4 text-sm" 
              value={newCampaign.endDate}
              onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Proximity Geolocation Controls */}
        <div className="form-group space-y-2">
          <label className="form-label text-xs">Event Location</label>
          <input 
            type="text" 
            className="form-input py-2.5 px-4 text-sm" 
            placeholder="e.g. CodeNode, London" 
            value={newCampaign.location}
            onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, location: e.target.value }))}
            required
          />
          
          <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">Geofencing Radius Proximity</span>
              <button 
                type="button" 
                onClick={fetchCoordinates}
                disabled={gpsLoading}
                className="flex items-center gap-1 bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-nimiq-gold transition-colors duration-150"
              >
                {gpsLoading ? (
                  <>
                    <Loader2 size={11} className="animate-spin" /> Locking GPS...
                  </>
                ) : (
                  <>
                    <Navigation size={11} /> Auto-lock My GPS
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="number" 
                step="any"
                className="form-input py-2 px-3 text-xs" 
                placeholder="Latitude (optional)" 
                value={newCampaign.latitude || ''}
                onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, latitude: parseFloat(e.target.value) || undefined }))}
              />
              <input 
                type="number" 
                step="any"
                className="form-input py-2 px-3 text-xs" 
                placeholder="Longitude (optional)" 
                value={newCampaign.longitude || ''}
                onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, longitude: parseFloat(e.target.value) || undefined }))}
              />
            </div>
            {gpsError && (
              <p className="text-[10px] text-rose-400 font-semibold">{gpsError}</p>
            )}
            <p className="text-[10px] text-slate-500">
              Entering coordinates locks reward claiming to a 200-meter radius around these coordinates. Leave blank to disable geofence checks.
            </p>
          </div>
        </div>

        {/* Stage Builder */}
        <div className="border-t border-white/5 pt-5 mt-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-200">Associated Stages</h4>
          
          <div className="space-y-4">
            {newStages.map((stage, idx) => (
              <div 
                key={idx} 
                className="bg-white/[0.005] border border-white/5 p-4 rounded-xl space-y-3 relative group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-nimiq-gold">Stage #{idx + 1}</span>
                  {newStages.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeStage(idx)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors duration-150 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input py-2 px-3 text-xs" 
                    placeholder="Stage Title" 
                    value={stage.title}
                    onChange={(e) => updateStageField(idx, 'title', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input py-2 px-3 text-xs" 
                    placeholder="Stage Description" 
                    value={stage.description}
                    onChange={(e) => updateStageField(idx, 'description', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Verification</label>
                    <select 
                      className="form-input py-1.5 px-3 text-xs cursor-pointer"
                      value={stage.verificationMethod}
                      onChange={(e) => updateStageField(idx, 'verificationMethod', e.target.value)}
                    >
                      <option value="dynamic_qr">Dynamic HMAC QR</option>
                      <option value="quiz">Developer Quiz</option>
                      <option value="secret_code">Secret Code</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Reward (NIM)</label>
                    <input 
                      type="number" 
                      className="form-input py-1.5 px-3 text-xs"
                      value={stage.rewardAmount}
                      onChange={(e) => updateStageField(idx, 'rewardAmount', parseInt(e.target.value, 10) || 0)}
                      required
                      min={1}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button"
            onClick={addStage}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors duration-150"
          >
            + Add Stage
          </button>
        </div>

        {/* Submit */}
        <div className="border-t border-white/5 pt-5 mt-6">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-nimiq-gold to-[#b8831b] hover:shadow-glow text-nimiq-dark py-3 rounded-xl text-sm font-extrabold transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            Fund Escrow & Launch Campaign
          </button>
        </div>
      </form>
    </div>
  );
};
