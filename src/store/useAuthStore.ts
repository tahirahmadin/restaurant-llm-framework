import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types/auth';
import { clearLocalStorage } from '../utils/storage';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  solanaAddress: string | null;
  activeTab: "orders" | "menu" | "profile" | "payments" | "help" | "settings";
  setUser: (user: AuthUser | null) => void;
  setSolanaAddress: (address: string) => void;
  setActiveTab: (tab: "orders" | "menu" | "profile" | "payments" | "help" | "settings") => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      solanaAddress: null,
      activeTab: 'orders',
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSolanaAddress: (address) => set({ solanaAddress: address }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      logout: () => {
        clearLocalStorage();
        set({ user: null, isAuthenticated: false, solanaAddress: null, activeTab: 'orders' });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;