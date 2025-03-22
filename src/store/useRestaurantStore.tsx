import { create } from "zustand";
import { toast } from "sonner";
import { getRestaurantProfile } from "../actions/serverActions";
import type { RestaurantProfile } from "../types/restaurant";

interface RestaurantState {
  profile: RestaurantProfile | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: (adminId: string) => Promise<void>;
  setProfile: (profile: RestaurantProfile) => void;
}

const useRestaurantStore = create<RestaurantState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  loadProfile: async (adminId) => {
    set({ isLoading: true });
    try {
      const profile = await getRestaurantProfile(adminId);
      set({ profile, error: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load restaurant profile";
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  setProfile: (profile) => {
    set({ profile });
  },
}));

export default useRestaurantStore;
