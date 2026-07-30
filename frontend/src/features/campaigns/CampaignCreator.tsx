import React, { useState, useEffect } from 'react';
import { PlusCircle, HelpCircle, Navigation, Loader2, ChevronRight, ChevronLeft, Award, Settings, MapPin, Layers, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Auto-calculate reward pool in real-time based on stages and max claims
  const calculatedEscrow = newStages.reduce((acc, stage) => {
    return acc + ((stage.rewardAmount || 0) * (stage.maximumClaims || 0));
  }, 0);

  // Sync calculated value with campaign rewardPool
  useEffect(() => {
    setNewCampaign((prev: any) => ({
      ...prev,
      rewardPool: calculatedEscrow
    }));
  }, [calculatedEscrow, setNewCampaign]);

  const fetchCoordinates = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    // Try with high accuracy first (usually fires GPS chip)
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
        console.warn("High-accuracy GPS request failed, retrying with standard accuracy...", error);
        
        // Fallback: Try with lower accuracy, allowing cached positions up to 5 minutes old
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            setNewCampaign((prev: any) => ({
              ...prev,
              latitude: parseFloat(fallbackPos.coords.latitude.toFixed(6)),
              longitude: parseFloat(fallbackPos.coords.longitude.toFixed(6)),
            }));
            setGpsLoading(false);
          },
          (fallbackError) => {
            console.error("Standard GPS request failed:", fallbackError);
            setGpsError("GPS permission denied or unavailable in this webview. You can type coordinates manually below.");
            setGpsLoading(false);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 4000 }
    );
  };

  const addStage = () => {
    setNewStages(prev => [
      ...prev,
      { 
        title: `Event Stage #${prev.length + 1}`, 
        description: 'Check in to earn rewards.', 
        rewardType: 'fixed', 
        rewardAmount: 10, 
        verificationMethod: 'secret_code', 
        maximumClaims: 50,
        quizData: []
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

  // Step Validation Helpers
  const isStepValid = (step: number): boolean => {
    if (step === 1) {
      return !!(newCampaign.title && newCampaign.description && newCampaign.startDate && newCampaign.endDate);
    }
    if (step === 2) {
      return !!newCampaign.location;
    }
    if (step === 3) {
      if (newStages.length === 0) return false;
      return newStages.every(s => {
        if (!s.title || !s.description || s.rewardAmount <= 0 || s.maximumClaims <= 0) {
          return false;
        }
        if (s.verificationMethod === 'quiz') {
          const q = s.quizData?.[0];
          if (!q || !q.question || !q.options || q.options.some((o: string) => !o.trim())) {
            return false;
          }
        }
        return true;
      });
    }
    return true;
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStepValid(1) && isStepValid(2) && isStepValid(3)) {
      onCreateCampaign(e);
    }
  };

  return (
    <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-6 shadow-glass">
      {/* Wizard Header */}
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <PlusCircle size={20} className="text-nimiq-gold" />
          Deploy Escrow Reward Campaign
        </h3>
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-lg">
          Step {currentStep} of 4
        </span>
      </div>

      {/* Progress Steps Indicator */}
      <div className="flex items-center justify-between mb-8 px-2 max-w-lg mx-auto">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={step > currentStep && !isStepValid(currentStep)}
                onClick={() => setCurrentStep(step)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep === step 
                    ? 'bg-nimiq-gold text-white shadow-md scale-110' 
                    : currentStep > step
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-500 border border-white/5'
                }`}
              >
                {step}
              </button>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase mt-1.5 tracking-wider">
                {step === 1 ? 'Details' : step === 2 ? 'Location' : step === 3 ? 'Stages' : 'Escrow'}
              </span>
            </div>
            {step < 4 && (
              <div className={`flex-1 h-[2px] mx-2 transition-all duration-300 ${
                currentStep > step ? 'bg-emerald-500/30' : 'bg-white/5'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Steps */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="form-group">
                <label className="form-label text-xs">Campaign Title</label>
                <input 
                  type="text" 
                  className="form-input py-2.5 px-4 text-sm" 
                  placeholder="e.g. Nimiq London Builders Meetup" 
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs">Description</label>
                <textarea 
                  className="form-input py-2.5 px-4 text-sm" 
                  rows={3} 
                  placeholder="Explain event agenda, reward claims, and attendance guidelines..." 
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="form-group">
                <label className="form-label text-xs flex items-center gap-1">
                  <MapPin size={12} className="text-nimiq-gold" /> Event Location
                </label>
                <input 
                  type="text" 
                  className="form-input py-2.5 px-4 text-sm" 
                  placeholder="e.g. CodeNode, London" 
                  value={newCampaign.location}
                  onChange={(e) => setNewCampaign((prev: any) => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>

              <div className="bg-white/[0.01] dark:bg-slate-900/10 border border-white/5 dark:border-slate-800/40 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Geofencing GPS Verification</span>
                  <button 
                    type="button" 
                    onClick={fetchCoordinates}
                    disabled={gpsLoading}
                    className="flex items-center gap-1 bg-white/5 dark:bg-slate-800/50 border border-white/10 dark:border-slate-800/40 hover:bg-white/10 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-bold text-nimiq-gold transition-colors duration-150 active:scale-95"
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
                  Entering GPS coordinates restricts claim rewards to a 200-meter physical boundary. Leave blank to bypass geofence checks.
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black tracking-wider uppercase text-slate-400 flex items-center gap-1">
                  <Layers size={12} className="text-nimiq-gold" /> Campaign Stages Configuration
                </h4>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {newStages.map((stage, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white/[0.01] dark:bg-slate-900/10 border border-white/5 dark:border-slate-800/40 p-4 rounded-xl space-y-3 relative group"
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

                    <div className="grid grid-cols-3 gap-3">
                      <div className="form-group col-span-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Verification</label>
                        <select 
                          className="form-input py-1.5 px-3 text-xs cursor-pointer"
                          value={stage.verificationMethod}
                          onChange={(e) => updateStageField(idx, 'verificationMethod', e.target.value)}
                        >
                          <option value="dynamic_qr">Dynamic QR</option>
                          <option value="quiz">Developer Quiz</option>
                          <option value="secret_code">Secret Code</option>
                        </select>
                      </div>

                      <div className="form-group col-span-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Reward (NIM)</label>
                        <input 
                          type="number" 
                          className="form-input py-1.5 px-3 text-xs"
                          value={stage.rewardAmount}
                          onChange={(e) => updateStageField(idx, 'rewardAmount', parseInt(e.target.value, 10) || 0)}
                          required
                          min={1}
                        />
                      </div>

                      <div className="form-group col-span-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Max Claims</label>
                        <input 
                          type="number" 
                          className="form-input py-1.5 px-3 text-xs"
                          value={stage.maximumClaims}
                          onChange={(e) => updateStageField(idx, 'maximumClaims', parseInt(e.target.value, 10) || 0)}
                          required
                          min={1}
                        />
                      </div>
                    </div>

                    {/* Secret Code Config */}
                    {stage.verificationMethod === 'secret_code' && (
                      <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl space-y-1 mt-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Verification Secret Code</label>
                        <div className="text-xs font-mono font-bold text-nimiq-gold bg-nimiq-gold/10 px-3 py-1 rounded-lg border border-nimiq-gold/20 select-all w-fit">
                          nim_rally_2026
                        </div>
                        <p className="text-[9px] text-slate-500">
                          Attendees must enter this secret code at the event check-in desk to complete the stage.
                        </p>
                      </div>
                    )}

                    {/* Developer Quiz Config */}
                    {stage.verificationMethod === 'quiz' && (
                      <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl space-y-2 mt-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Quiz Question</label>
                        <input 
                          type="text" 
                          className="form-input py-1.5 px-3 text-xs" 
                          placeholder="e.g. Which blockchain does RallyNIM run on?" 
                          value={stage.quizData?.[0]?.question || ''}
                          onChange={(e) => {
                            const quizData = [{
                              question: e.target.value,
                              options: stage.quizData?.[0]?.options || ['', '', '', ''],
                              correctAnswerIndex: stage.quizData?.[0]?.correctAnswerIndex || 0
                            }];
                            updateStageField(idx, 'quizData', quizData);
                          }}
                          required
                        />
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mt-1">Options</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[0, 1, 2, 3].map((optIdx) => (
                            <input 
                              key={optIdx}
                              type="text" 
                              className="form-input py-1 px-2.5 text-xs" 
                              placeholder={`Option ${optIdx + 1}`} 
                              value={stage.quizData?.[0]?.options?.[optIdx] || ''}
                              onChange={(e) => {
                                const newOptions = [...(stage.quizData?.[0]?.options || ['', '', '', ''])];
                                newOptions[optIdx] = e.target.value;
                                const quizData = [{
                                  question: stage.quizData?.[0]?.question || '',
                                  options: newOptions,
                                  correctAnswerIndex: stage.quizData?.[0]?.correctAnswerIndex || 0
                                }];
                                updateStageField(idx, 'quizData', quizData);
                              }}
                              required
                            />
                          ))}
                        </div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mt-1">Correct Option</label>
                        <select 
                          className="form-input py-1 px-2 text-xs"
                          value={stage.quizData?.[0]?.correctAnswerIndex || 0}
                          onChange={(e) => {
                            const quizData = [{
                              question: stage.quizData?.[0]?.question || '',
                              options: stage.quizData?.[0]?.options || ['', '', '', ''],
                              correctAnswerIndex: parseInt(e.target.value, 10)
                            }];
                            updateStageField(idx, 'quizData', quizData);
                          }}
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                          <option value={3}>Option 4</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                type="button"
                onClick={addStage}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors duration-150 active:scale-95"
              >
                + Add Stage
              </button>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Interactive Escrow Calculator */}
              <div className="bg-white/[0.01] dark:bg-slate-900/10 border border-white/5 dark:border-slate-800/40 p-5 rounded-xl space-y-4">
                <h4 className="text-xs font-black tracking-wider uppercase text-nimiq-gold flex items-center gap-1.5">
                  <Coins size={14} /> Interactive Escrow Calculator
                </h4>
                
                <div className="space-y-2.5 text-xs">
                  {newStages.map((stage, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2">
                      <span>Stage #{idx + 1}: {stage.title || 'Untitled Stage'}</span>
                      <span className="font-mono text-slate-200">
                        {stage.rewardAmount} NIM × {stage.maximumClaims} claims = <span className="font-bold text-slate-100">{(stage.rewardAmount * stage.maximumClaims).toLocaleString()} NIM</span>
                      </span>
                    </div>
                  ))}
                  
                  <div className="pt-3 flex justify-between items-center text-sm font-bold text-slate-200">
                    <span>Total Required Escrow Funding:</span>
                    <span className="text-nimiq-gold font-black font-mono text-base">{calculatedEscrow.toLocaleString()} NIM</span>
                  </div>
                </div>

                <div className="bg-nimiq-gold/5 border border-nimiq-gold/20 p-3.5 rounded-xl">
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-relaxed">
                    The total reward pool is calculated dynamically. By confirming, the platform will automatically prompt your connected wallet to send <strong>{calculatedEscrow} NIM</strong> into the dynamic on-chain escrow address.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Actions */}
        <div className="flex justify-between items-center border-t border-white/5 pt-5 mt-6 gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 bg-white/5 border border-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-colors duration-150 active:scale-95"
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-nimiq-gold to-blue-600 hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-none text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ml-auto"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-nimiq-gold to-blue-600 hover:shadow-lg disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 ml-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Publishing Escrow...
                </>
              ) : (
                <>
                  <Award size={14} /> Fund Escrow &amp; Launch
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
