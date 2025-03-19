export interface AuthUser {
  adminId: string;
  email: string;
  restaurantIds: number[];
  role: string;
  createdDate: string;
  lastUpdatedAt: string;
}

export interface SignupData {
  email: string;
  password: string;
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
