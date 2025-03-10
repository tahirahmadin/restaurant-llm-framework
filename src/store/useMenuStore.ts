import { create } from "zustand";
import { toast } from "sonner";
import { getRestaurantMenu } from "../actions/serverActions";
import type { MenuItem } from "../types/menu";

interface MenuState {
  items: MenuItem[];
  isLoading: boolean;
  error: string | null;
  loadMenu: (restaurantId: string | number) => Promise<void>;
  setItems: (items: MenuItem[]) => void;
}

const useMenuStore = create<MenuState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  loadMenu: async (restaurantId) => {
    set({ isLoading: true });
    try {
      const items = await getRestaurantMenu(restaurantId);
      set({ items, error: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load menu";
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  setItems: (items) => {
    set({ items });
  },
}));

export default useMenuStore;
