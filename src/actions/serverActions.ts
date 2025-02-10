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
  customerDetails: CustomerDetails;
}

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  email?: string;
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
  status: "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED",
  estimatedDeliveryTime: number
): Promise<Order[] | null> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/updateOrderStatus`,
      {
        orderId,
        status,
        estimatedDeliveryTime,
      }
    );

    if (!response.data.error) {
      return response.data.result;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    return null;
  }
};
