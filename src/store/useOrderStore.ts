import { create } from "zustand";

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  email?: string;
}

interface OrderItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  _id: string;
  orderId: string;
  items: OrderItem[];
  status: "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  restaurantName: string;
  user: string;
  paymentId: string;
  paymentStatus: string;
  paymentMethod: string;
  estimatedMinutes?: number;
  customerDetails: CustomerDetails;
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (
    orderId: string,
    newStatus: "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED"
  ) => void;
  updateEstimatedTime: (orderId: string, minutes: number) => void;
}

const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  setOrders: (orders) => set({ orders }),

  updateOrderStatus: (orderId, newStatus) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order._id === orderId ? { ...order, status: newStatus } : order
      ),
    })),

  updateEstimatedTime: (orderId, minutes) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order._id === orderId ? { ...order, estimatedMinutes: minutes } : order
      ),
    })),
}));

export default useOrderStore;
