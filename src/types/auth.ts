export interface AuthUser {
  adminId: string;
  email: string;
  restaurantId: number;
  username: string;
  isChain: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  chainType?: "SINGLE" | "MULTI";
  restaurantDetails: RestaurantDetails;
  locations?: RestaurantLocation[];
}

export interface RestaurantDetails {
  name: string;
  description: string;
  image: string;
  contactNo: string;
  address: string;
  location?: {
    longitude: number;
    latitude: number;
  };
}

export interface RestaurantLocation {
  address: string;
  location: {
    longitude: number;
    latitude: number;
  };
}

export interface LoginData {
  email: string;
  password: string;
}
