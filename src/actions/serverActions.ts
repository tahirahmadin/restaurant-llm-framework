import axios from "axios";
import type { SignupData, LoginData } from "../types/auth";
import type { RestaurantProfile } from "../types/restaurant";
import type { MenuItem } from "../types/menu";
import type { LocationDetails } from "../types/location";

let apiUrl: string = import.meta.env.VITE_PUBLIC_BACKEND_API_URL;

export const generateLLMResponse = async (
  systemPrompt: string,
  maxTokens: number = 1000,
  model: string = "OPENAI",
  temperature: number = 0.5
): Promise<any> => {
  try {
    const response = await axios.post(
      `${apiUrl}/menu/generateText`,
      {
        systemPrompt,
        maxTokens,
        model,
        temperature,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }
    throw new Error("Failed to generate LLM response");
  } catch (error) {
    console.error("Error generating LLM response:", error);
    throw error;
  }
};
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

interface PaymentModes {
  CRYPTO: boolean;
  STRIPE: boolean;
  UPI: boolean;
  COUNTER: boolean;
}

interface OperationModes {
  DINE_IN: boolean;
  DELIVERY: boolean;
}

export const updatePaymentOperationModes = async (
  restaurantId: number,
  paymentModes: PaymentModes,
  operationModes: OperationModes,
  adminUsername: string
): Promise<{ success: boolean }> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/updatePaymentOperationModes`,
      {
        restaurantId,
        paymentModes,
        operationModes,
        adminUsername,
      }
    );

    if (response.data && !response.data.error) {
      return { success: true };
    }

    throw new Error(response.data.error || "Failed to update settings");
  } catch (error) {
    console.error("Error updating payment and operation modes:", error);
    throw error;
  }
};

export const fetchRestaurantOrders = async (
  email: string
): Promise<Order[]> => {
  try {
    const response = await axios.get(
      `${apiUrl}/restaurant/getRestaurantOrders`,
      {
        params: { email },
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
  estimatedDeliveryTime: number,
  deliveryAgentId?: string
): Promise<Order[] | null> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/updateOrderStatus`,
      {
        orderId,
        status,
        estimatedDeliveryTime,
        deliveryAgentId,
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

export const createRestaurant = async (
  signupData: SignupData
): Promise<{
  userId: string;
  username: string;
  restaurantId: string;
  isChain: boolean;
}> => {
  try {
    const response = await axios.post(`${apiUrl}/restaurant/createRestaurant`, {
      restaurantDetails: signupData.restaurantDetails,
      email: signupData.email,
      password: signupData.password,
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

export const createChainRestaurant = async (
  signupData: SignupData
): Promise<{
  userId: string;
  username: string;
  restaurantId: string;
  isChain: boolean;
}> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/createChainRestaurant`,
      {
        restaurantDetails: signupData.restaurantDetails,
        email: signupData.email,
        password: signupData.password,
        locations: signupData.locations || [],
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

export const addRestaurantsToChain = async (
  restaurants: LocationDetails[],
  adminId: string
): Promise<LocationDetails[]> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/addRestaurantsToChain`,
      {
        restaurants: restaurants.map((restaurant) => ({
          name: restaurant.name,
          contactNo: restaurant.contactNo,
          address: restaurant.address,
          location: {
            latitude: restaurant.location.latitude,
            longitude: restaurant.location.longitude,
          },
          manager: {
            email: restaurant.manager?.email,
            password: restaurant.manager?.password,
          },
        })),
        adminId,
      }
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(response.data.error || "Failed to add locations");
  } catch (error) {
    console.error("Error adding location:", error);
    throw error;
  }
};

export const getChainLocations = async (
  adminId: string
): Promise<LocationDetails[]> => {
  try {
    const response = await axios.get(
      `${apiUrl}/restaurant/getChainRestaurants`,
      {
        params: { adminId },
      }
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(response.data.error || "Failed to fetch locations");
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
};

export const authenticateAdmin = async (
  loginData: LoginData
): Promise<{
  userId: string;
  username: string;
}> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/authenticateAdmin`,
      {
        email: loginData.email,
        password: loginData.password,
      }
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(response.data.error || "Authentication failed");
  } catch (error) {
    console.error("Error authenticating:", error);
    throw error;
  }
};

export const getRestaurantProfile = async (
  email: string
): Promise<RestaurantProfile> => {
  try {
    const response = await axios.get(
      `${apiUrl}/restaurant/getRestaurant/${email}`
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(
      response.data.error || "Failed to fetch restaurant profile"
    );
  } catch (error) {
    console.error("Error fetching restaurant profile:", error);
    throw error;
  }
};

export const updateRestaurantProfile = async (
  email: string,
  data: Partial<RestaurantProfile>
): Promise<RestaurantProfile> => {
  try {
    const response = await axios.put(
      `${apiUrl}/restaurant/updateRestaurant/${email}`,
      data
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(
      response.data.error || "Failed to update restaurant profile"
    );
  } catch (error) {
    console.error("Error updating restaurant profile:", error);
    throw error;
  }
};

export const addMenuItem = async (
  restaurantId: number,
  menuItem: Partial<MenuItem> & { adminUsername: string }
): Promise<MenuItem> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/addMenuItem/${restaurantId}`,
      menuItem
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(response.data.error || "Failed to add menu item");
  } catch (error) {
    console.error("Error adding menu item:", error);
    throw error;
  }
};

export const updateMenuItem = async (
  restaurantId: number,
  itemId: number,
  menuItem: Partial<MenuItem> & { adminUsername: string }
): Promise<MenuItem> => {
  try {
    const response = await axios.put(
      `${apiUrl}/restaurant/updateMenuItem/${restaurantId}/${itemId}`,
      menuItem
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(response.data.error || "Failed to update menu item");
  } catch (error) {
    console.error("Error updating menu item:", error);
    throw error;
  }
};

export const deleteMenuItem = async (
  restaurantId: number,
  itemId: number,
  adminUsername: string
): Promise<any> => {
  try {
    // Create proper payload
    const payload = {
      adminUsername: adminUsername,
    };

    const response = await axios.delete(
      `${apiUrl}/restaurant/deleteMenuItem/${restaurantId}/${itemId}`,
      {
        data: payload,
      }
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(response.data.error || "Failed to delete menu item");
  } catch (error) {
    console.error("Error deleting menu item:", error);
    throw error;
  }
};

export const getRestaurantMenu = async (email: string): Promise<MenuItem[]> => {
  try {
    const response = await axios.get(
      `${apiUrl}/restaurant/getRestaurantMenu/${email}`
    );

    if (response.data && !response.data.error) {
      return response.data.result.menu.items;
    }

    throw new Error(response.data.error || "Failed to fetch restaurant menu");
  } catch (error) {
    console.error("Error fetching restaurant menu:", error);
    throw error;
  }
};

export const getMostOrderedItems = async (
  restaurantId: string | number,
  limit: number = 5
): Promise<{
  items: Array<{
    itemId: string;
    count: number;
    name: string;
    price: number;
  }>;
  totalOrders: number;
  totalSales: number;
}> => {
  try {
    const response = await axios.get(
      `${apiUrl}/restaurant/most-ordered-items`,
      {
        params: { restaurantId, limit },
      }
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(
      response.data.error || "Failed to fetch most ordered items"
    );
  } catch (error) {
    console.error("Error fetching most ordered items:", error);
    throw error;
  }
};

export const updateRestaurantOnlineStatus = async (
  email: string
): Promise<{ isOnline: boolean }> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/updateOnlineStatus`,
      {
        email,
      }
    );

    if (response.data && !response.data.error) {
      return {
        isOnline: response.data.result.isOnline,
      };
    }

    throw new Error(response.data.error || "Failed to update online status");
  } catch (error) {
    console.error("Error updating online status:", error);
    throw error;
  }
};

// export const updateSolanaDepositAddress = async (
//   restaurantId: string | number,
//   solanaAddress: string,
//   adminUsername: string
// ): Promise<{ success: boolean }> => {
//   try {
//     const response = await axios.put(
//       `${apiUrl}/restaurant/updateSolanaDepositAddress`,
//       {
//         restaurantId,
//         solanaAddress,
//         adminUsername
//       }
//     );

//     if (response.data && !response.data.error) {
//       return { success: true };
//     }

//     throw new Error(response.data.error || "Failed to update Solana deposit address");
//   } catch (error) {
//     console.error("Error updating Solana deposit address:", error);
//     throw error;
//   }
// };

export const updateBSCBaseDepositAddress = async (
  restaurantId: number,
  bscBaseAddress: string,
  adminUsername: string
): Promise<{ success: boolean }> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/updateBSCBaseDepositAddress`,
      {
        restaurantId,
        bscBaseAddress,
        adminUsername,
      }
    );

    if (response.data && response.data.error === false) {
      return { success: true };
    }

    throw new Error("Failed to update BSC Base deposit address");
  } catch (error) {
    console.error("Error updating BSC Base deposit address:", error);
    throw error;
  }
};

export const getDeliveryAgents = async (
  restaurantId: string | number
): Promise<
  Array<{
    id: string;
    username: string;
    isOnline: boolean;
    currentOrder?: string;
    totalDeliveries: number;
  }>
> => {
  try {
    const response = await axios.get(`${apiUrl}/restaurant/getDeliveryAgents`, {
      params: { restaurantId: restaurantId.toString() },
    });

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(response.data.error || "Failed to fetch delivery agents");
  } catch (error) {
    console.error("Error fetching delivery agents:", error);
    throw error;
  }
};

export const createDeliveryAgent = async (
  restaurantId: string | number,
  username: string,
  password: string,
  superadminUsername: string,
  superadminPassword: string
): Promise<{
  id: string;
  username: string;
}> => {
  try {
    const response = await axios.post(
      `${apiUrl}/restaurant/createDeliveryAgent`,
      {
        restaurantId,
        username,
        password,
        superadminUsername,
        superadminPassword,
      }
    );

    if (response.data && !response.data.error) {
      return response.data.result;
    }

    throw new Error(response.data.error || "Failed to create delivery agent");
  } catch (error) {
    console.error("Error creating delivery agent:", error);
    throw error;
  }
};
