export interface RestaurantProfile {
  _id: string;
  restaurantId: number;
  name: string;
  description: string;
  image: string;
  contactNo: string;
  address: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  isOnline: boolean;
  menuUploaded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantUpdateData {
  name?: string;
  description?: string;
  image?: string;
  contactNo?: string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isOnline?: boolean;
  menuUploaded?: boolean;
}