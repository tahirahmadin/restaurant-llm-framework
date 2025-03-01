import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "../types/auth";
import { clearLocalStorage } from "../utils/storage";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  bscBaseAddress: string | null;
  activeTab:
    | "orders"
    | "menu"
    | "profile"
    | "payments"
    | "help"
    | "settings"
    | "overview";
  setUser: (user: AuthUser | null) => void;
  setBSCBaseAddress: (address: string) => void;
  setActiveTab: (
    tab:
      | "orders"
      | "menu"
      | "profile"
      | "payments"
      | "help"
      | "settings"
      | "overview"
  ) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      bscBaseAddress: null,
      activeTab: "orders",
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setBSCBaseAddress: (address) => set({ bscBaseAddress: address }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      logout: () => {
        clearLocalStorage();
        set({
          user: null,
          isAuthenticated: false,
          bscBaseAddress: null,
          activeTab: "orders",
        });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

export default useAuthStore;
