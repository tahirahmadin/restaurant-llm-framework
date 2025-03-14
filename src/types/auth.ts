export interface AuthUser {
  id: string;
  username: string;
  restaurantId: string;
}

export interface SignupData {
  username: string;
  password: string;
  restaurantDetails: RestaurantDetails;
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

export interface LoginData {
  username: string;
  password: string;
}