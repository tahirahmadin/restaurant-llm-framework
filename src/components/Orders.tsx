import React, { useState, useEffect } from "react";
import { Search, Filter, Clock } from "lucide-react";
import { fetchRestaurantOrders } from "../actions/serverActions";
import useOrderStore from "../store/useOrderStore";
import { toast } from "sonner";

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
}

interface OrderItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image: string;
}

export function Orders() {
  const [activeStatus, setActiveStatus] = useState<
    "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED"
  >("PROCESSING");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const { orders, setOrders, updateOrderStatus, updateEstimatedTime } =
    useOrderStore();

  // Initial data load
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const fetchedOrders = await fetchRestaurantOrders("5");
        console.log(fetchedOrders);
        setOrders(fetchedOrders);
      } catch (error) {
        toast.error("Failed to load orders");
        console.error("Error loading orders:", error);
      }
    };

    loadOrders();
  }, [setOrders]);

  const handleUpdateStatus = (order: Order, newStatus: string) => {
    try {
      updateOrderStatus(order._id, newStatus);
      toast.success(`Order ${order._id} status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status");
      console.error("Error updating order status:", error);
    }
  };

  const handleUpdateDeliveryTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      try {
        updateEstimatedTime(selectedOrder._id, estimatedMinutes);
        toast.success(`Delivery time updated for order ${selectedOrder._id}`);
        setEstimatedMinutes(15); // Reset to default
      } catch (error) {
        toast.error("Failed to update delivery time");
        console.error("Error updating delivery time:", error);
      }
    }
  };

  const filteredOrders = orders.filter(
    (order) => order.status === activeStatus
  );

  return (
    <div className="flex h-full">
      {/* Left Panel - Orders List */}
      <div className="w-1/2 p-6 border-r">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 w-64 focus:outline-none focus:ring-2 focus:ring-[#f15927]"
              />
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveStatus("PROCESSING")}
            className={`px-4 py-2 rounded-lg ${
              activeStatus === "PROCESSING"
                ? "bg-[#f15927] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Fresh Orders
          </button>
          <button
            onClick={() => setActiveStatus("COOKING")}
            className={`px-4 py-2 rounded-lg ${
              activeStatus === "COOKING"
                ? "bg-[#f15927] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Cooking
          </button>
          <button
            onClick={() => setActiveStatus("OUT_FOR_DELIVERY")}
            className={`px-4 py-2 rounded-lg ${
              activeStatus === "OUT_FOR_DELIVERY"
                ? "bg-[#f15927] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Out for Delivery
          </button>
          <button
            onClick={() => setActiveStatus("COMPLETED")}
            className={`px-4 py-2 rounded-lg ${
              activeStatus === "COMPLETED"
                ? "bg-[#f15927] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <button
              key={order._id}
              onClick={() => setSelectedOrder(order)}
              className={`w-full p-4 rounded-xl border ${
                selectedOrder?._id === order._id
                  ? "border-[#f15927] bg-orange-50"
                  : "border-gray-200 hover:border-[#f15927] hover:bg-orange-50"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    Order: {order.orderId.slice(30, 35)}
                  </span>
                  <span className="text-sm text-gray-500">
                    User: {order.user.slice(0, 8)}...
                    {order.estimatedMinutes && (
                      <span className="ml-2">
                        Est: {order.estimatedMinutes} mins
                      </span>
                    )}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    order.status === "fresh"
                      ? "bg-yellow-100 text-yellow-600"
                      : order.status === "cooking"
                      ? "bg-orange-100 text-[#f15927]"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="font-semibold">
                  {(order.totalAmount / 100).toFixed(2)} AED
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - Order Details */}
      <div className="w-1/2 p-6">
        {selectedOrder ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  Order {selectedOrder.orderId.slice(30, 40)}
                </h2>
              </div>
              <span className="text-[#f15927] bg-orange-100 px-3 py-1 rounded-full">
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Delivery Location */}
            {selectedOrder.customerDetails && (
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h3 className="font-medium mb-3">Delivery Location</h3>
                <div className="text-gray-600">
                  <p>{selectedOrder.customerDetails.name}</p>
                  <p>{selectedOrder.customerDetails.address}</p>

                  <p className="mt-2">
                    📞 {selectedOrder.customerDetails.phone}
                  </p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-xl border border-gray-200">
              <h3 className="font-medium p-4 border-b">Items for Delivery</h3>
              {selectedOrder.items.map((item, index) => (
                <div
                  key={index}
                  className={`flex gap-4 p-4 ${
                    index !== selectedOrder.items.length - 1 ? "border-b" : ""
                  }`}
                >
                  <img
                    src={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/5-${item.id}.jpg`}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {item.description}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {(item.price * item.quantity).toFixed(2)} AED
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              {selectedOrder.status === "cooking" && (
                <form onSubmit={handleUpdateDeliveryTime} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Time (minutes)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={estimatedMinutes}
                      onChange={(e) =>
                        setEstimatedMinutes(
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="flex-1 p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f15927]"
                      required
                    />
                  </div>
                </form>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between font-semibold text-lg pt-2 ">
                  <span>Total</span>
                  <span>
                    {(selectedOrder.totalAmount / 100).toFixed(2)} AED
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                className={`w-full py-3 rounded-lg transition-colors ${
                  selectedOrder.status === "COMPLETED"
                    ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                    : "bg-[#f15927] text-white hover:bg-[#d94d1f]"
                }`}
                onClick={() => {
                  const nextStatus =
                    selectedOrder.status === "PROCESSING"
                      ? "COOKING"
                      : selectedOrder.status === "COOKING"
                      ? "OUT_FOR_DELIVERY"
                      : "COMPLETED";
                  handleUpdateStatus(selectedOrder, nextStatus);
                }}
                disabled={selectedOrder.status === "COMPLETED"}
              >
                {selectedOrder.status === "PROCESSING"
                  ? "Start Cooking"
                  : selectedOrder.status === "COOKING"
                  ? "Send for Delivery"
                  : selectedOrder.status === "OUT_FOR_DELIVERY"
                  ? "Mark as Completed"
                  : "Order Completed"}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select an order to view details
          </div>
        )}
      </div>
    </div>
  );
}
