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
