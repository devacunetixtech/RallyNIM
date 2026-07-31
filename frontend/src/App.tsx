import React, { useState, useEffect } from 'react';
import { Compass, User, PlusCircle, BarChart2, RefreshCw, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { useAuthStore } from './store/useAuthStore';
import { connectWallet, signMessage as nimiqSignMessage, getBalance as nimiqGetBalance, disconnectWallet, getActiveAddress, sendTransaction as nimiqSendTransaction, isInsideNimiqPay, syncNimiqPayAddress } from './lib/nimiq';
import { api } from './lib/api';

// Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NotificationBanner } from './components/NotificationBanner';

// Features
import { CampaignExplorer } from './features/campaigns/CampaignExplorer';
import { CampaignDetails } from './features/campaigns/CampaignDetails';
import { CampaignCreator } from './features/campaigns/CampaignCreator';
import { PassportView } from './features/passport/PassportView';
import { AnalyticsView } from './features/analytics/AnalyticsView';
import { HomeView } from './features/home/HomeView';

export default function App() {
  // Global auth state
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [walletLoading, setWalletLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'participant' | 'organizer'>('participant');
  const [pendingAuth, setPendingAuth] = useState<{ address: string; nonce: string } | null>(null);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'passport' | 'create' | 'analytics'>('home');
  
  // App data
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaignStages, setCampaignStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Wallet Balance
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  // Passport state
  const [myPassport, setMyPassport] = useState<any>(null);
  const [claimHistory, setClaimHistory] = useState<any[]>([]);
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Toggle theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };
  
  // Campaign Creator state
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    category: 'Conference',
    rewardPool: 50,
    startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [newStages, setNewStages] = useState<any[]>([
    { title: 'Welcome Check-in', description: 'Scan the presenter screen check-in QR code.', rewardType: 'fixed', rewardAmount: 10, verificationMethod: 'dynamic_qr', maximumClaims: 100 },
    { title: 'Attendee Quiz Challenge', description: 'Pass the basic quiz regarding this developer session.', rewardType: 'fixed', rewardAmount: 20, verificationMethod: 'quiz', maximumClaims: 100, quizData: [{ question: 'Which design pattern is RallyNIM based on?', options: ['Escrow Micropayments', 'Proof of Authority', 'Delegated PoS', 'Centralized Ledger'], correctAnswerIndex: 0 }] }
  ]);
  
  // Active claims
  const [activeVerificationStage, setActiveVerificationStage] = useState<any>(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  
  // Organizer QR display terminal
  const [organizerQrToken, setOrganizerQrToken] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(20);
  const [activeQrStageId, setActiveQrStageId] = useState<string | null>(null);

  // Load initial data and sync mobile address
  useEffect(() => {
    const initApp = async () => {
      await fetchCampaigns();
      if (isAuthenticated) {
        if (isInsideNimiqPay()) {
          const synced = await syncNimiqPayAddress();
          if (synced && user && user.walletAddress.toLowerCase() !== synced.toLowerCase()) {
            setAuth(useAuthStore.getState().token || '', {
              ...user,
              walletAddress: synced
            });
          }
        }
        await fetchPassport();
        await updateBalance();
        await fetchHistory();
      }
    };
    initApp();
  }, [isAuthenticated]);

  // Periodically refresh balance while connected to show live blockchain state
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      updateBalance();
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // QR token rotation timer
  useEffect(() => {
    let interval: any;
    if (activeQrStageId) {
      rotateQrToken(activeQrStageId);
      
      interval = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            rotateQrToken(activeQrStageId);
            return 20;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQrStageId]);

  const rotateQrToken = async (stageId: string) => {
    try {
      const res = await api.rewards.generateQr(stageId);
      setOrganizerQrToken(res.token);
    } catch (err: any) {
      console.error('Failed to generate dynamic QR token:', err);
    }
  };

  const updateBalance = async () => {
    try {
      const balance = await nimiqGetBalance();
      setWalletBalance(balance);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.campaigns.list();
      setCampaigns(res.campaigns);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchPassport = async () => {
    try {
      const res = await api.passport.get();
      setMyPassport(res.passport);
    } catch (err) {
      console.error('Passport not found, initializing...');
    }
  };

  const fetchHistory = async () => {
    try {
      if (user?.role === 'organizer') {
        const res = await api.rewards.organizerHistory();
        setClaimHistory(res.history);
      } else {
        const res = await api.rewards.history();
        setClaimHistory(res.history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Seed sample data
  const seedSampleData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const mockCampaigns = [
        {
          title: 'Nimiq Hackathon London 2026',
          description: 'A 48-hour building sprint focused on Nimiq Pay integrations and web-native micropayments.',
          category: 'Hackathon',
          rewardPool: 300,
          location: 'CodeNode, London',
          latitude: 51.520448,
          longitude: -0.086976,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
          stages: [
            {
              title: 'Opening Ceremony Check-In',
              description: 'Scan the main presenter screen QR code during the introduction.',
              rewardType: 'fixed',
              rewardAmount: 20,
              verificationMethod: 'dynamic_qr',
              maximumClaims: 150,
              startsAt: new Date(),
              endsAt: new Date(Date.now() + 86400000)
            },
            {
              title: 'Developer SDK Quiz',
              description: 'Pass the basic quiz regarding Nimiq Mini App API protocols.',
              rewardType: 'fixed',
              rewardAmount: 30,
              verificationMethod: 'quiz',
              maximumClaims: 150,
              startsAt: new Date(),
              endsAt: new Date(Date.now() + 86400000 * 2),
              quizData: [
                {
                  question: 'Which method returns the active user address in Nimiq Mini App SDK?',
                  options: ['requestAddress()', 'getWalletAddress()', 'connect()', 'fetchAccount()'],
                  correctAnswerIndex: 0
                }
              ]
            }
          ]
        },
      ];

      for (const campaign of mockCampaigns) {
        const { stages, ...campaignData } = campaign;
        await api.campaigns.create(campaignData, stages);
      }

      await fetchCampaigns();
      setSuccessMessage('Sample events successfully seeded!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Seeding failed. Make sure server is running and connected to MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  // Connect Wallet Flow
  const handleConnectWallet = async () => {
    setWalletLoading(true);
    setErrorMessage(null);
    try {
      // 1. Request address from Nimiq Pay via official SDK
      const address = await connectWallet();

      // 2. Get a nonce from our backend
      const { nonce } = await api.auth.connect(address);

      if (isInsideNimiqPay()) {
        // Nimiq Pay uses native bridge - no popup blocker issue.
        const signatureMessage = `Sign this message to authenticate with RallyNIM. Nonce: ${nonce}`;
        const { publicKey, signature } = await nimiqSignMessage(signatureMessage);

        const response = await api.auth.verify(address, signature, publicKey, selectedRole);

        setAuth(response.token, {
          ...response.user,
          role: selectedRole
        });

        setSuccessMessage('Wallet connected successfully!');
        updateBalance();

        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      } else {
        // Standard Web Browser: Open a signature verification modal
        // to ensure the user clicks 'Sign' directly, keeping user gesture active.
        setPendingAuth({ address, nonce });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect wallet');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleCompleteAuth = async () => {
    if (!pendingAuth) return;
    setWalletLoading(true);
    setErrorMessage(null);
    try {
      const { address, nonce } = pendingAuth;
      const signatureMessage = `Sign this message to authenticate with RallyNIM. Nonce: ${nonce}`;
      const { publicKey, signature } = await nimiqSignMessage(signatureMessage);

      // In case the user signed with a different address in the Hub than first chosen,
      // use the updated active address returned by the signing flow.
      const actualAddress = getActiveAddress() || address;
      const response = await api.auth.verify(actualAddress, signature, publicKey, selectedRole);

      setAuth(response.token, {
        ...response.user,
        role: selectedRole
      });

      setSuccessMessage('Wallet connected successfully!');
      updateBalance();
      setPendingAuth(null);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify signature');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    clearAuth();
    setMyPassport(null);
    setClaimHistory([]);
    setSuccessMessage('Wallet disconnected');
  };

  const handleSelectCampaign = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.campaigns.getById(id);
      setSelectedCampaign(res.campaign);
      setCampaignStages(res.stages);
      setActiveVerificationStage(null);
      setVerificationInput('');
      setQuizAnswers({});
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  // Submit Claim Flow
  const handleClaim = async (stage: any, locationData?: { latitude: number; longitude: number }) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload: any = {};
      if (locationData) {
        payload.latitude = locationData.latitude;
        payload.longitude = locationData.longitude;
      }

      if (stage.verificationMethod === 'dynamic_qr') {
        if (!verificationInput.trim()) {
          throw new Error('Please enter the dynamic QR code string or scan it.');
        }
        payload.token = verificationInput.trim();
      } else if (stage.verificationMethod === 'quiz') {
        const answersArray = stage.quizData.map((q: any, i: number) => {
          if (quizAnswers[i] === undefined) {
            throw new Error(`Please answer question ${i + 1}`);
          }
          if (quizAnswers[i] !== q.correctAnswerIndex) {
            throw new Error(`Incorrect answer for question ${i + 1}. Try again!`);
          }
          return quizAnswers[i];
        });
        payload.answers = answersArray;
      } else if (stage.verificationMethod === 'secret_code') {
        if (!verificationInput.trim()) {
          throw new Error('Please enter the secret code.');
        }
        payload.code = verificationInput.trim();
      }

      setLoading(true);
      const res = await api.rewards.claim(selectedCampaign._id, stage._id, JSON.stringify(payload));
      
      if (res.success) {
        setSuccessMessage(`Successfully claimed ${stage.rewardAmount} NIM reward!`);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        handleSelectCampaign(selectedCampaign._id);
        fetchPassport();
        
        // Poll for balance updates on-chain over the next 10 seconds to account for block mining latency
        let polls = 0;
        const pollInterval = setInterval(async () => {
          await updateBalance();
          polls++;
          if (polls >= 5) clearInterval(pollInterval);
        }, 2000);

        fetchHistory();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Claim failed');
    } finally {
      setLoading(false);
    }
  };

  // Create Campaign Flow
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    
    try {
      if (!newCampaign.title || !newCampaign.description || !newCampaign.location) {
        throw new Error('Please fill in all general campaign fields');
      }

      const res = await api.campaigns.create(newCampaign, newStages);
      
      // Fund campaign using Nimiq escrow service
      const configRes = await api.campaigns.getEscrowAddress();
      const escrowAddress = configRes.escrowAddress;
      const txHash = await nimiqSendTransaction(escrowAddress, newCampaign.rewardPool, res.campaign._id);
      
      // Publish campaign to Live
      await api.campaigns.publish(res.campaign._id, txHash);
      
      setSuccessMessage('Campaign funded and published live successfully!');
      
      // Reset form
      setNewCampaign({
        title: '',
        description: '',
        category: 'Conference',
        rewardPool: 50,
        startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
        location: '',
        latitude: undefined,
        longitude: undefined
      });
      
      fetchCampaigns();
      setActiveTab('explore');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  // Publish Draft Campaign
  const handlePublishDraft = async (campaignId: string, customTxHash?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      let txHash = customTxHash?.trim();
      if (!txHash) {
        // Find campaign details
        const targetCamp = campaigns.find(c => c._id === campaignId) || selectedCampaign;
        if (!targetCamp) throw new Error('Campaign details not found');

        const configRes = await api.campaigns.getEscrowAddress();
        const escrowAddress = configRes.escrowAddress;
        txHash = await nimiqSendTransaction(escrowAddress, targetCamp.rewardPool, campaignId);
      }
      
      // Publish campaign to Live
      await api.campaigns.publish(campaignId, txHash);
      
      setSuccessMessage('Campaign funded and published live successfully!');
      
      // Refresh campaign list
      await fetchCampaigns();
      
      // Select the published campaign again to update the view
      await handleSelectCampaign(campaignId);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish campaign');
    } finally {
      setLoading(false);
    }
  };

  // Pause Campaign
  const handlePauseCampaign = async (campaignId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await api.campaigns.pause(campaignId);
      setSuccessMessage('Campaign paused successfully.');
      setSelectedCampaign(res.campaign);
      await fetchCampaigns();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to pause campaign');
    } finally {
      setLoading(false);
    }
  };

  // Resume Campaign
  const handleResumeCampaign = async (campaignId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await api.campaigns.resume(campaignId);
      setSuccessMessage('Campaign resumed successfully.');
      setSelectedCampaign(res.campaign);
      await fetchCampaigns();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resume campaign');
    } finally {
      setLoading(false);
    }
  };

  // Cancel Campaign
  const handleCancelCampaign = async (campaignId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await api.campaigns.cancel(campaignId);
      setSuccessMessage('Campaign cancelled successfully.');
      setSelectedCampaign(res.campaign);
      await fetchCampaigns();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 pt-4 font-sans text-slate-200">
      
      {/* HEADER SECTION */}
      <Header 
        isAuthenticated={isAuthenticated}
        user={user}
        walletBalance={walletBalance}
        walletLoading={walletLoading}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnect}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* FEEDBACK BANNERS */}
      <NotificationBanner 
        errorMessage={errorMessage}
        successMessage={successMessage}
        onClearError={() => setErrorMessage(null)}
        onClearSuccess={() => setSuccessMessage(null)}
      />

      {/* MAIN LAYOUT */}
      <main className="min-h-[60vh] space-y-6 mt-8">
        
        {/* TAB NAVIGATION */}
        <div className="flex gap-2.5 border-b border-white/5 pb-3 overflow-x-auto">
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'home' 
                ? 'bg-gradient-to-r from-nimiq-gold to-[#163da1] text-white shadow-glow' 
                : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
            onClick={() => { setActiveTab('home'); setSelectedCampaign(null); }}
          >
            <Home size={15} />
            Home
          </button>
          
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'explore' 
                ? 'bg-gradient-to-r from-nimiq-gold to-[#163da1] text-white shadow-glow' 
                : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
            onClick={() => { setActiveTab('explore'); setSelectedCampaign(null); }}
          >
            <Compass size={15} />
            Explore Campaigns
          </button>
          
          {isAuthenticated && (
            <>
              <button 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'passport' 
                    ? 'bg-gradient-to-r from-nimiq-gold to-[#163da1] text-white shadow-glow' 
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
                onClick={() => setActiveTab('passport')}
              >
                <User size={15} />
                My Passport
              </button>
              
              {user?.role === 'organizer' && (
                <>
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      activeTab === 'create' 
                        ? 'bg-gradient-to-r from-nimiq-gold to-[#163da1] text-white shadow-glow' 
                        : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                    onClick={() => setActiveTab('create')}
                  >
                    <PlusCircle size={15} />
                    Create Campaign
                  </button>
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      activeTab === 'analytics' 
                        ? 'bg-gradient-to-r from-nimiq-gold to-[#163da1] text-white shadow-glow' 
                        : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart2 size={15} />
                    Analytics
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* TAB CONTENTS WITH TRANSITIONS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedCampaign ? `-${selectedCampaign._id}` : '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && (
              <HomeView 
                onStartExploring={() => setActiveTab('explore')}
                network={import.meta.env.VITE_NETWORK || 'mainnet'}
              />
            )}

            {activeTab === 'explore' && !selectedCampaign && (
              <CampaignExplorer 
                campaigns={campaigns}
                loading={loading}
                onSelectCampaign={handleSelectCampaign}
              />
            )}

            {activeTab === 'explore' && selectedCampaign && (
              <CampaignDetails 
                campaign={selectedCampaign}
                stages={campaignStages}
                claimHistory={claimHistory}
                isAuthenticated={isAuthenticated}
                user={user}
                onBack={() => setSelectedCampaign(null)}
                activeVerificationStage={activeVerificationStage}
                setActiveVerificationStage={setActiveVerificationStage}
                verificationInput={verificationInput}
                setVerificationInput={setVerificationInput}
                quizAnswers={quizAnswers}
                setQuizAnswers={setQuizAnswers}
                onClaim={handleClaim}
                loading={loading}
                organizerQrToken={organizerQrToken}
                setSuccessMessage={setSuccessMessage}
                activeQrStageId={activeQrStageId}
                setActiveQrStageId={setActiveQrStageId}
                qrCountdown={qrCountdown}
                onPublishDraft={handlePublishDraft}
                onPauseCampaign={handlePauseCampaign}
                onResumeCampaign={handleResumeCampaign}
                onCancelCampaign={handleCancelCampaign}
              />
            )}

            {activeTab === 'passport' && isAuthenticated && (
              <PassportView 
                user={user}
                myPassport={myPassport}
                claimHistory={claimHistory}
                loading={loading}
              />
            )}

            {activeTab === 'create' && isAuthenticated && user?.role === 'organizer' && (
              <CampaignCreator 
                newCampaign={newCampaign}
                setNewCampaign={setNewCampaign}
                newStages={newStages}
                setNewStages={setNewStages}
                onCreateCampaign={handleCreateCampaign}
                loading={loading}
              />
            )}

            {activeTab === 'analytics' && isAuthenticated && user?.role === 'organizer' && (
              <AnalyticsView 
                claimHistory={claimHistory}
                campaigns={campaigns}
                organizerId={user?._id || ''}
                loading={loading}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* FOOTER */}
      <Footer />

      {/* SIGNATURE VERIFICATION MODAL */}
      <AnimatePresence>
        {pendingAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f142c]/90 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl backdrop-blur-md"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-nimiq-gold/10 border border-nimiq-gold/20 rounded-full text-nimiq-gold animate-pulse">
                  <span className="w-3 h-3 rounded-full bg-nimiq-gold inline-block" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Verify Wallet Ownership
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You connected address <span className="font-mono text-slate-200 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{pendingAuth.address.slice(0, 6)}···{pendingAuth.address.slice(-4)}</span>.
                  Please sign a secure cryptographic challenge message to authenticate.
                </p>
                <div className="w-full flex flex-col gap-2 mt-2">
                  <button
                    onClick={handleCompleteAuth}
                    disabled={walletLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-nimiq-gold to-[#163da1] hover:shadow-glow text-white py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50"
                  >
                    {walletLoading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      'Sign Message & Verify'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPendingAuth(null);
                      setWalletLoading(false);
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
