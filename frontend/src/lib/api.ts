import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    localStorage.removeItem('nimiq_wallet_address');
  }

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data as T;
}

export const api = {
  auth: {
    connect: (walletAddress: string) => 
      request<{ nonce: string }>('/auth/connect', {
        method: 'POST',
        body: JSON.stringify({ walletAddress })
      }),
      
    verify: (walletAddress: string, signature: string, publicKey: string, role?: string) =>
      request<{ token: string; user: any }>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ walletAddress, signature, publicKey, role })
      }),
      
    me: () => 
      request<{ user: any }>('/auth/me'),
      
    logout: () => 
      request<{ success: boolean }>('/auth/logout', {
        method: 'POST'
      })
  },
  
  campaigns: {
    list: (filters: { category?: string; status?: string; organizer?: string } = {}) => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.organizer) params.append('organizer', filters.organizer);
      return request<{ campaigns: any[] }>(`/campaigns?${params.toString()}`);
    },
    
    getById: (id: string) => 
      request<{ campaign: any; stages: any[] }>(`/campaigns/${id}`),
      
    create: (campaignData: any, stages: any[]) =>
      request<{ campaign: any; stages: any[] }>('/campaigns', {
        method: 'POST',
        body: JSON.stringify({ ...campaignData, stages })
      }),
      
    publish: (id: string, txHash: string) =>
      request<{ campaign: any }>(`/campaigns/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ txHash })
      }),
      
    pause: (id: string) =>
      request<{ campaign: any }>(`/campaigns/${id}/pause`, {
        method: 'POST'
      }),
      
    resume: (id: string) =>
      request<{ campaign: any }>(`/campaigns/${id}/resume`, {
        method: 'POST'
      }),
      
    cancel: (id: string) =>
      request<{ campaign: any }>(`/campaigns/${id}/cancel`, {
        method: 'POST'
      }),
      
    getEscrowAddress: () =>
      request<{ escrowAddress: string }>('/campaigns/escrow/address')
  },
  
  rewards: {
    claim: (campaignId: string, stageId: string, verificationData?: string) =>
      request<{ success: boolean; claim: any }>('/reward/claim', {
        method: 'POST',
        body: JSON.stringify({ campaignId, stageId, verificationData })
      }),
      
    getPublicStats: () =>
      request<{ totalParticipants: number; totalClaimed: number; totalOrganizers: number; totalUniqueAddresses: number; recentClaims: any[] }>('/reward/public/stats'),
      
    getVerifiableParticipants: () =>
      request<any[]>('/reward/public/verifiable-participants'),
      
    history: () =>
      request<{ history: any[] }>('/reward/history'),
      
    organizerHistory: () =>
      request<{ history: any[] }>('/reward/organizer/history'),
      
    generateQr: (stageId: string) =>
      request<{ token: string }>('/reward/qr/generate', {
        method: 'POST',
        body: JSON.stringify({ stageId })
      })
  },
  
  passport: {
    get: () =>
      request<{ passport: any }>('/passport'),
      
    getPublic: (walletAddress: string) =>
      request<{ passport: any }>(`/passport/${walletAddress}`)
  }
};
