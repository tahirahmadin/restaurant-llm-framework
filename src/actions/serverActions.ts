import axios from "axios";

let apiUrl: string = "https://payments.gobbl.ai/api";
let restaurantApiUrl: string = "https://restauranttest.gobbl.ai/api";

export interface OrderItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
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
}

export const fetchRestaurantOrders = async (
  restaurantId: string
): Promise<Order[]> => {
  try {
    const response = await axios.get(
      `${apiUrl}/restaurant/getRestaurantOrders`,
      {
        params: { restaurantId },
      }
    );

    if (response.data && !response.data.error) {
      return response.data.data;
    }

    throw new Error(response.data.error || "Failed to fetch orders");
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};
