import React, { useState, useEffect } from 'react';
import { Compass, User, PlusCircle, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { useAuthStore } from './store/useAuthStore';
import { nimiqWallet } from './lib/nimiq';
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

export default function App() {
  // Global auth state
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [walletLoading, setWalletLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'participant' | 'organizer'>('participant');
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'explore' | 'passport' | 'create' | 'analytics'>('explore');
  
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
  
  // Campaign Creator state
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    category: 'Conference',
    rewardPool: 50,
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
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

  // Load initial data
  useEffect(() => {
    fetchCampaigns();
    if (isAuthenticated) {
      fetchPassport();
      updateBalance();
      fetchHistory();
    }
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
      const balance = await nimiqWallet.getBalance();
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
      const res = await api.rewards.history();
      setClaimHistory(res.history);
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
        {
          title: 'Paris Web3 Blockchain Summit',
          description: 'Gathering of top European Web3 builders to discuss decentralized UI developments and Nimiq Pay integration.',
          category: 'Summit',
          rewardPool: 500,
          location: 'Palais des Congrès, Paris',
          latitude: 48.878776,
          longitude: 2.283457,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
          stages: [
            {
              title: 'Escrow Keynote Attendee',
              description: 'Scan the screen after the Nimiq smart wallet keynote.',
              rewardType: 'fixed',
              rewardAmount: 50,
              verificationMethod: 'dynamic_qr',
              maximumClaims: 80,
              startsAt: new Date(),
              endsAt: new Date(Date.now() + 86400000)
            }
          ]
        }
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
      const address = await nimiqWallet.connect();
      const { nonce } = await api.auth.connect(address);
      
      const signatureMessage = `Sign this message to authenticate with RallyNIM. Nonce: ${nonce}`;
      const signature = await nimiqWallet.signMessage(signatureMessage);
      
      const response = await api.auth.verify(address, signature, 'mock_public_key');
      
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
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect wallet');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDisconnect = () => {
    nimiqWallet.disconnect();
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
        updateBalance();
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
      const escrowAddress = 'NQ34 G6XF HT9Y SMQ2 YS1X U29D E91X 557U F31P';
      const txHash = await nimiqWallet.sendTransaction(escrowAddress, newCampaign.rewardPool, res.campaign._id);
      
      // Publish campaign to Live
      await api.campaigns.publish(res.campaign._id, txHash);
      
      setSuccessMessage('Campaign funded and published live successfully!');
      
      // Reset form
      setNewCampaign({
        title: '',
        description: '',
        category: 'Conference',
        rewardPool: 50,
        startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
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
        isMock={nimiqWallet.isMock()}
      />

      {/* FEEDBACK BANNERS */}
      <NotificationBanner 
        errorMessage={errorMessage}
        successMessage={successMessage}
        onClearError={() => setErrorMessage(null)}
        onClearSuccess={() => setSuccessMessage(null)}
      />

      {/* MAIN LAYOUT */}
      <main className="min-h-[60vh] space-y-6">
        
        {/* TAB NAVIGATION */}
        <div className="flex gap-2.5 border-b border-white/5 pb-3 overflow-x-auto">
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
            {activeTab === 'explore' && !selectedCampaign && (
              <CampaignExplorer 
                campaigns={campaigns}
                loading={loading}
                onSelectCampaign={handleSelectCampaign}
                onSeedSampleData={seedSampleData}
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
              />
            )}

            {activeTab === 'passport' && isAuthenticated && (
              <PassportView 
                user={user}
                myPassport={myPassport}
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
                claimHistoryLength={claimHistory.length}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}
