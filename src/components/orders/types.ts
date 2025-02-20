export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  email?: string;
}

export interface OrderItem {
  id?: string;
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
  customerDetails: CustomerDetails;
  estimatedMinutes?: number;
}
