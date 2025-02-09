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
  id: string;
  table: string;
  items: OrderItem[];
  status: "fresh" | "cooking" | "completed";
  time: string;
  estimatedMinutes?: number;
  total: number;
}

export const fetchRestaurantOrders = async (
  restaurantName: string
): Promise<Order[]> => {
  try {
    const response = await axios.get(
      `${apiUrl}/restaurant/getRestaurantOrders`,
      {
        params: { restaurantName },
      }
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(response.data.error || "Failed to fetch orders");
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED"
): Promise<void> => {
  try {
    const response = await axios.put(`${apiUrl}/restaurant/updateOrderStatus`, {
      orderId,
      status,
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to update order status");
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};
