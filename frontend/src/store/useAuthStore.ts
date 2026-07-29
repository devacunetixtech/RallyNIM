import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  _id: string;
  walletAddress: string;
  role: 'organizer' | 'participant' | 'sponsor' | 'merchant';
  username?: string;
  avatar?: string;
  bio?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'rallynim-auth-storage',
    }
  )
);
