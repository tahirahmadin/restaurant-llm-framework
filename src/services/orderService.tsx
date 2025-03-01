import { create } from "zustand";
import { toast } from "sonner";
import {
  fetchRestaurantOrders,
  updateOrderStatus as updateOrderStatusAPI,
} from "../actions/serverActions";
import type { Order } from "../components/orders/types";

interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  loadOrders: (restaurantId: string | number) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    status: string,
    estimatedTime: number
  ) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  loadOrders: async (restaurantId) => {
    set({ isLoading: true });
    try {
      const orders = await fetchRestaurantOrders(restaurantId);
      set({ orders, isLoading: false, error: null });
    } catch (error) {
      set({ error: "Failed to load orders", isLoading: false });
      toast.error("Failed to load orders");
    }
  },

  updateOrderStatus: async (orderId, status, estimatedTime) => {
    try {
      const updatedOrders = await updateOrderStatusAPI(
        orderId,
        status as "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED",
        estimatedTime
      );
      if (updatedOrders) {
        set({ orders: updatedOrders });
        toast.success(`Order status updated to ${status}`);
      }
    } catch (error) {
      toast.error("Failed to update order status");
    }
  },
}));
