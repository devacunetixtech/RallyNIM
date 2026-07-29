import React from 'react';
import { MapPin, Calendar, Award, Layers } from 'lucide-react';
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

          <div className="space-y-4">
            {stages.map((stage, idx) => {
              const isClaimed = claimHistory.some(ch => ch.stageId?._id === stage._id);
              const isActive = stage.status === 'active';
              
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
        </div>
      </div>
    </div>
  );
};
