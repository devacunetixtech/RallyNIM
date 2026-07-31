import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Lock, QrCode, ShieldAlert, Navigation, HelpCircle, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface StageVerificationCardProps {
  stage: any;
  idx: number;
  isAuthenticated: boolean;
  user: any;
  isClaimed: boolean;
  isActive: boolean;
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
  onLaunchTerminal: (stageId: string) => void;
}

export const StageVerificationCard: React.FC<StageVerificationCardProps> = ({
  stage,
  idx,
  isAuthenticated,
  user,
  isClaimed,
  isActive,
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
  onLaunchTerminal,
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [useGeofence, setUseGeofence] = useState(true);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerId = `qr-reader-${stage._id}`;

  const now = new Date();
  const startsAt = stage.startsAt ? new Date(stage.startsAt) : null;
  const endsAt = stage.endsAt ? new Date(stage.endsAt) : null;
  const isUpcoming = startsAt ? now < startsAt : false;
  const isExpired = endsAt ? now > endsAt : false;

  // Geolocation trigger
  useEffect(() => {
    if (useGeofence && isActive && !isClaimed) {
      getLocation();
    }
  }, [useGeofence, isActive]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        let msg = "Failed to fetch GPS coordinates.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Proximity verification might fail.";
        }
        setLocationError(msg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // HTML5 QR Code Scanner trigger
  useEffect(() => {
    if (showScanner) {
      setCameraPermissionError(null);
      // Delay initialization slightly to ensure container is fully mounted in DOM
      const timer = setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode(scannerId);
          html5QrCodeRef.current = html5QrCode;

          html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            (decodedText) => {
              setVerificationInput(decodedText);
              setSuccessMessage("QR Code scanned successfully!");
              setShowScanner(false);
              html5QrCode.stop().then(() => {
                html5QrCodeRef.current = null;
              }).catch(err => console.error("Scanner stop error", err));
            },
            (error) => {
              // Non-blocking scan errors
            }
          ).catch(err => {
            console.error("Failed to start camera scan:", err);
            setCameraPermissionError("Could not access the rear camera. Please ensure camera permissions are granted.");
          });
        } catch (e) {
          console.error("Failed to initialize QR Scanner:", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5QrCodeRef.current) {
          const instance = html5QrCodeRef.current;
          html5QrCodeRef.current = null;
          try {
            instance.stop().catch(err => console.error("Scanner stop error during unmount", err));
          } catch (e) {
            // Already stopped or not started
          }
        }
      };
    }
  }, [showScanner]);

  const handleClaimSubmit = () => {
    // Collect location if checked
    const locationData = useGeofence && coordinates ? coordinates : undefined;
    onClaim(stage, locationData);
  };

  return (
    <div 
      className={`glass-panel border-l-4 transition-all duration-300 ${
        isClaimed 
          ? 'border-emerald-500 bg-emerald-500/[0.01]' 
          : isUpcoming
          ? 'border-amber-500/30 bg-white/[0.005] opacity-80'
          : isExpired
          ? 'border-rose-500/30 bg-white/[0.005] opacity-70'
          : isActive 
          ? 'border-nimiq-gold bg-white/[0.01]' 
          : 'border-white/5 opacity-60'
      }`}
    >
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-400 bg-white/5 w-5 h-5 rounded-full flex items-center justify-center">
              {idx + 1}
            </span>
            <h4 className="text-base font-bold text-slate-100">{stage.title}</h4>
          </div>
          <p className="text-sm text-slate-400 mb-3">{stage.description}</p>
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-nimiq-gold">
            +{stage.rewardAmount} NIM
          </div>
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            {stage.verificationMethod.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Verification Action Block */}
      {isAuthenticated ? (
        user?.role === 'organizer' ? (
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="inline-flex items-center gap-2 text-nimiq-gold bg-nimiq-gold/10 px-3 py-1.5 rounded-lg text-xs font-bold border border-nimiq-gold/20">
              <CheckCircle size={14} />
              Organizer View — {stage.claimed || 0} claims processed
            </div>
            {isUpcoming && (
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold tracking-wider uppercase px-2 py-1 rounded-md">
                Upcoming
              </span>
            )}
            {isExpired && (
              <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold tracking-wider uppercase px-2 py-1 rounded-md">
                Ended
              </span>
            )}
          </div>
        ) : isClaimed ? (
          <div className="inline-flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg text-xs font-medium mt-3 border border-emerald-500/20">
            <CheckCircle size={14} />
            Claimed successfully
          </div>
        ) : isUpcoming ? (
          <div className="inline-flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg text-xs font-semibold mt-3 border border-amber-500/20">
            Starts: {startsAt?.toLocaleString()}
          </div>
        ) : isExpired ? (
          <div className="inline-flex items-center gap-2 text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg text-xs font-semibold mt-3 border border-rose-500/20">
            Expired: Closed at {endsAt?.toLocaleString()}
          </div>
        ) : isActive ? (
          <div className="border-t border-white/5 pt-4 mt-3">
            {activeVerificationStage?._id === stage._id ? (
              <div className="space-y-4">
                
                {/* 1. Geofencing Coordinates Controller */}
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Navigation size={15} className={coordinates ? "text-nimiq-gold animate-pulse" : "text-slate-500"} />
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block">Proximity Check-In</span>
                      {locationLoading ? (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" /> Fetching GPS coordinates...
                        </span>
                      ) : coordinates ? (
                        <span className="text-[10px] font-mono text-emerald-400">
                          GPS Locked: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                        </span>
                      ) : locationError ? (
                        <span className="text-[10px] text-rose-400">{locationError}</span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Enable location services to verify proximity.</span>
                      )}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={useGeofence} 
                      onChange={(e) => setUseGeofence(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-nimiq-gold peer-checked:after:bg-nimiq-dark"></div>
                  </label>
                </div>

                {/* 2. Challenge Submissions */}
                {stage.verificationMethod === 'dynamic_qr' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        className="form-input text-sm py-2 px-3 flex-1"
                        placeholder="Paste scan token or scan camera..."
                        value={verificationInput}
                        onChange={(e) => setVerificationInput(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowScanner(!showScanner)}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95"
                        >
                          <QrCode size={14} />
                          {showScanner ? 'Close' : 'Camera'}
                        </button>
                        <button 
                          onClick={handleClaimSubmit}
                          disabled={loading}
                          className="bg-gradient-to-r from-nimiq-gold to-[#163da1] hover:shadow-glow text-white px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50"
                        >
                          Claim
                        </button>
                      </div>
                    </div>

                    {/* Camera Scanner View */}
                    {showScanner && (
                      <div className="border border-white/10 rounded-xl overflow-hidden bg-black max-w-sm mx-auto p-4 relative space-y-2">
                        <div id={scannerId} className="w-full min-h-[220px] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-white/5"></div>
                        {cameraPermissionError ? (
                          <p className="text-[10px] text-center text-rose-400 font-bold">
                            {cameraPermissionError}
                          </p>
                        ) : (
                          <p className="text-[10px] text-center text-slate-500">
                            Rear camera active. Point at the presenter QR code.
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Dev Tool Fallback */}
                    {organizerQrToken && (
                      <button 
                        onClick={() => {
                          setVerificationInput(organizerQrToken);
                          setSuccessMessage("Token auto-filled from organizer simulator!");
                        }}
                        className="text-[10px] font-semibold text-nimiq-gold hover:text-nimiq-yellow flex items-center gap-1 mt-1 transition-colors duration-200"
                      >
                        ⚡ Simulator Auto-Fill Token
                      </button>
                    )}
                  </div>
                )}

                {stage.verificationMethod === 'quiz' && (
                  <div className="space-y-4">
                    {stage.quizData.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="space-y-2">
                        <p className="text-sm font-semibold text-slate-200">{q.question}</p>
                        <div className="flex flex-col gap-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <label 
                              key={optIdx} 
                              className={`flex items-center gap-3 bg-white/[0.01] border p-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                                quizAnswers[qIdx] === optIdx 
                                  ? 'border-nimiq-gold bg-nimiq-gold/5 text-nimiq-gold' 
                                  : 'border-white/5 text-slate-300 hover:bg-white/[0.03]'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name={`quiz_${stage._id}_${qIdx}`}
                                checked={quizAnswers[qIdx] === optIdx}
                                onChange={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                                className="accent-nimiq-gold w-4 h-4"
                              />
                              <span className="text-xs">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={handleClaimSubmit}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-nimiq-gold to-[#163da1] hover:shadow-glow text-white py-2.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50"
                    >
                      Submit Answers
                    </button>
                  </div>
                )}

                {stage.verificationMethod === 'secret_code' && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Enter the secret code provided by the organizer:</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="form-input text-sm py-2 px-3 flex-1"
                        placeholder="Type secret code..."
                        value={verificationInput}
                        onChange={(e) => setVerificationInput(e.target.value)}
                      />
                      <button 
                        onClick={handleClaimSubmit}
                        disabled={loading}
                        className="bg-gradient-to-r from-nimiq-gold to-[#163da1] hover:shadow-glow text-white px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50"
                      >
                        Claim
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <HelpCircle size={10} /> Test code is <code className="bg-white/5 px-1 rounded text-nimiq-gold font-mono font-bold">nim_rally_2026</code>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => {
                  setActiveVerificationStage(stage);
                  setVerificationInput('');
                  setQuizAnswers({});
                }}
                className="bg-gradient-to-r from-nimiq-gold to-[#163da1] hover:shadow-glow text-white px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95"
              >
                Complete Challenge to Claim
              </button>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 text-slate-500 text-xs mt-3">
            <Lock size={12} />
            Locked until previous stage is claimed
          </div>
        )
      ) : (
        <div className="text-slate-500 text-xs mt-3">
          Connect your wallet to participate and earn.
        </div>
      )}

      {/* Organizer Display Terminal Button */}
      {isAuthenticated && user?.role === 'organizer' && stage.verificationMethod === 'dynamic_qr' && (
        <div className="mt-3 pt-3 border-t border-dashed border-white/5">
          <button 
            onClick={() => onLaunchTerminal(stage._id)}
            className="flex items-center gap-1.5 bg-white/5 border border-nimiq-gold/20 hover:border-nimiq-gold/40 text-nimiq-gold px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95"
          >
            <QrCode size={13} />
            Launch Presenter QR Display
          </button>
        </div>
      )}
    </div>
  );
};
