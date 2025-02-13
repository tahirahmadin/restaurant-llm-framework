import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types/auth';
import { clearLocalStorage } from '../utils/storage';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  solanaAddress: string | null;
  setUser: (user: AuthUser | null) => void;
  setSolanaAddress: (address: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      solanaAddress: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSolanaAddress: (address) => set({ solanaAddress: address }),
      logout: () => {
        clearLocalStorage();
        set({ user: null, isAuthenticated: false,solanaAddress: null  });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore