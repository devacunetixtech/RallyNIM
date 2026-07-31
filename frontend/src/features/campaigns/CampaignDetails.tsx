import React from 'react';
import { MapPin, Calendar, Award, Layers, RefreshCw } from 'lucide-react';
import { StageVerificationCard } from '../rewards/StageVerificationCard';
import { QrTerminal } from '../rewards/QrTerminal';

interface CampaignDetailsProps {
  campaign: any;
  stages: any[];
  claimHistory: any[];
  isAuthenticated: boolean;
  user: any;
  onBack: () => void;
  activeVerificationStage: any;
  setActiveVerificationStage: (stage: any) => void;
  verificationInput: string;
  setVerificationInput: (val: string) => void;
  quizAnswers: Record<number, number>;
  setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  onClaim: (stage: any, locationData?: { latitude: number; longitude: number }) => void;
  loading: boolean;
  organizerQrToken: string | null;
  setSuccessMessage: (msg: string | null) => void;
  
  // Qr Display Terminal
  activeQrStageId: string | null;
  setActiveQrStageId: (id: string | null) => void;
  qrCountdown: number;

  // Draft publishing
  onPublishDraft: (campaignId: string, customTxHash?: string) => void;
}

export const CampaignDetails: React.FC<CampaignDetailsProps> = ({
  campaign,
  stages,
  claimHistory,
  isAuthenticated,
  user,
  onBack,
  activeVerificationStage,
  setActiveVerificationStage,
  verificationInput,
  setVerificationInput,
  quizAnswers,
  setQuizAnswers,
  onClaim,
  loading,
  organizerQrToken,
  setSuccessMessage,
  activeQrStageId,
  setActiveQrStageId,
  qrCountdown,
  onPublishDraft,
}) => {
  return (
    <div>
      <button 
        onClick={onBack} 
        className="bg-white/5 hover:bg-white/10 active:scale-95 text-slate-200 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 mb-5"
      >
        &larr; Back to list
      </button>

      <div className="grid grid-cols-1 gap-6">
        {campaign.status === 'draft' && user?.role === 'organizer' && (
          <div className="glass-panel bg-gradient-to-br from-amber-500/10 to-amber-600/[0.02] border border-amber-500/20 shadow-glass rounded-2xl p-6 mb-2">
            <h3 className="text-base font-extrabold text-amber-400 mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Campaign Draft Status (Unpublished)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This campaign is in Draft mode and not visible to participants yet. To publish it live, it must be funded with <span className="font-extrabold text-nimiq-gold">{campaign.rewardPool} NIM</span> to the escrow pool.
            </p>
            
            <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
              {/* Option A: If already sent */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Option A: Query/Paste existing transaction hash</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="draft-tx-hash-input"
                    className="form-input text-xs py-2 px-3 flex-1 bg-slate-900/50 border-white/10"
                    placeholder="Enter Nimiq transaction hash (0x...)"
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('draft-tx-hash-input') as HTMLInputElement;
                      if (!input?.value.trim()) {
                        alert('Please enter a transaction hash.');
                        return;
                      }
                      onPublishDraft(campaign._id, input.value.trim());
                    }}
                    disabled={loading}
                    className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 disabled:opacity-50"
                  >
                    Verify &amp; Publish
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="h-px bg-white/5 flex-1" />
                <span className="text-[9px] text-slate-500 font-bold uppercase">Or</span>
                <div className="h-px bg-white/5 flex-1" />
              </div>

              {/* Option B: Fund escrow and publish */}
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-3.5 rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">Option B: Fund Escrow now</span>
                  <span className="text-[10px] text-slate-500">Initiates a payment of {campaign.rewardPool} NIM to escrow</span>
                </div>
                <button 
                  onClick={() => onPublishDraft(campaign._id)}
                  disabled={loading}
                  className="bg-gradient-to-r from-nimiq-gold to-[#163da1] hover:shadow-glow text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  Fund Escrow &amp; Publish
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Campaign Info Card */}
        <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 shadow-glass rounded-2xl p-6">
          <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-nimiq-gold/10 border border-nimiq-gold/30 text-nimiq-gold">
              {campaign.category}
            </span>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Campaign Active
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
                Verified Escrow
              </span>
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-3">{campaign.title}</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">{campaign.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-nimiq-gold shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Location</div>
                <div className="text-sm font-semibold text-slate-200">{campaign.location}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-sky-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Event Dates</div>
                <div className="text-sm font-semibold text-slate-200">
                  {new Date(campaign.startDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award size={18} className="text-nimiq-gold shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Escrow Balance</div>
                <div className="text-sm font-extrabold text-nimiq-gold">
                  {campaign.remainingPool} NIM / {campaign.rewardPool} NIM
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic QR Display Terminal Display */}
        {activeQrStageId && organizerQrToken && (
          <QrTerminal 
            stageId={activeQrStageId}
            token={organizerQrToken}
            countdown={qrCountdown}
            onClose={() => setActiveQrStageId(null)}
          />
        )}

        {/* Stages Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Layers size={18} className="text-nimiq-gold" />
            Event Stages Timeline
          </h3>

          {loading ? (
            <div className="glass-panel bg-white/[0.01] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center min-h-[150px] animate-pulse">
              <RefreshCw size={28} className="animate-spin text-nimiq-gold mb-2" />
              <span className="text-xs text-slate-500 font-medium">Loading event stages...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {stages.map((stage, idx) => {
                const isOrganizer = user?.role === 'organizer';
                const isClaimed = !isOrganizer && claimHistory.some(ch => ch.stageId?._id === stage._id);
                const hasClaimedPrev = isOrganizer || idx === 0 || claimHistory.some(ch => ch.stageId?._id === stages[idx - 1]._id);
                const isActive = isOrganizer || (stage.status === 'active' && hasClaimedPrev);
                
                return (
                  <StageVerificationCard 
                    key={stage._id}
                    stage={stage}
                    idx={idx}
                    isAuthenticated={isAuthenticated}
                    user={user}
                    isClaimed={isClaimed}
                    isActive={isActive}
                    activeVerificationStage={activeVerificationStage}
                    setActiveVerificationStage={setActiveVerificationStage}
                    verificationInput={verificationInput}
                    setVerificationInput={setVerificationInput}
                    quizAnswers={quizAnswers}
                    setQuizAnswers={setQuizAnswers}
                    onClaim={onClaim}
                    loading={loading}
                    organizerQrToken={organizerQrToken}
                    setSuccessMessage={setSuccessMessage}
                    onLaunchTerminal={(id) => {
                      setActiveQrStageId(id);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
