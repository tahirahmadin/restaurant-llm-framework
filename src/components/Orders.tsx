import React, { useState, useEffect } from "react";
import { Search, Filter, Clock, ChevronRight } from "lucide-react";
import {
  fetchRestaurantOrders,
  updateOrderStatus as updateOrderStatusAPI,
} from "../actions/serverActions";
import useOrderStore from "../store/useOrderStore";
import useAuthStore from "../store/useAuthStore";
import { toast } from "sonner";

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  email?: string;
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

interface OrderItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image: string;
}

export function Orders() {
  const { user } = useAuthStore();
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
      if (!user?.restaurantId) {
        toast.error("Restaurant ID not found");
        return;
      }

      try {
        const fetchedOrders = await fetchRestaurantOrders(user.restaurantId);
        console.log(fetchedOrders);
        setOrders(fetchedOrders);
      } catch (error) {
        toast.error("Failed to load orders");
        console.error("Error loading orders:", error);
      }
    };

    loadOrders();
  }, [setOrders, user?.restaurantId]);

  const handleUpdateStatus = (order: Order, newStatus: string) => {
    try {
      // Then make the API call
      updateOrderStatusAPI(
        order.orderId,
        newStatus as
          | "PROCESSING"
          | "COOKING"
          | "OUT_FOR_DELIVERY"
          | "COMPLETED",
        estimatedMinutes
      )
        .then((res) => {
          if (res) {
            console.log(res);
            setOrders(res);
            toast.success(
              `Order ${order.orderId.slice(
                30,
                40
              )} status updated to ${newStatus}`
            );
          }
        })
        .catch((error) => {
          toast.error("Failed to update order status");
        });
    } catch (error) {
      toast.error("Failed to update order status");
      console.error("Error updating order status:", error);
    }
  };

  const filteredOrders = orders.filter(
    (order) => order.status === activeStatus
  );

  return (
    <div className="flex h-full">
      {/* Left Panel - Orders List */}
      <div className="w-1/2 p-6 border-r bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your restaurant orders</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-4 mb-6 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveStatus("PROCESSING")}
            className={`px-4 py-2 rounded-lg ${
              activeStatus === "PROCESSING"
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            } whitespace-nowrap transition-all duration-200`}
          >
            Fresh Orders
          </button>
          <button
            onClick={() => setActiveStatus("COOKING")}
            className={`px-4 py-2 rounded-lg ${
              activeStatus === "COOKING"
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            } whitespace-nowrap transition-all duration-200`}
          >
            Cooking
          </button>
          <button
            onClick={() => setActiveStatus("OUT_FOR_DELIVERY")}
            className={`px-4 py-2 rounded-lg ${
              activeStatus === "OUT_FOR_DELIVERY"
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            } whitespace-nowrap transition-all duration-200`}
          >
            Out for Delivery
          </button>
          <button
            onClick={() => setActiveStatus("COMPLETED")}
            className={`px-4 py-2 rounded-lg ${
              activeStatus === "COMPLETED"
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            } whitespace-nowrap transition-all duration-200`}
          >
            Completed
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] no-scrollbar px-1">
          {filteredOrders.map((order) => (
            <button
              key={order._id}
              onClick={() => setSelectedOrder(order)}
              className={`w-full p-4 rounded-xl transition-all duration-200 hover:shadow-md relative overflow-hidden ${
                selectedOrder?._id === order._id
                  ? "bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
                  : "bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50 border border-gray-200"
              }`}
            >
              {/* Status Indicator Line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                order.status === "PROCESSING"
                  ? "bg-yellow-400"
                  : order.status === "COOKING"
                  ? "bg-red-500"
                  : order.status === "OUT_FOR_DELIVERY"
                  ? "bg-blue-500"
                  : "bg-green-500"
              }`} />

              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      #{order.orderId.slice(-8)}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">
                      {order.customerDetails?.name || "N/A"}
                    </span>
                    {order.estimatedMinutes && (
                      <span className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />
                        {order.estimatedMinutes} mins
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === "PROCESSING"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "COOKING"
                      ? "bg-red-100 text-red-700"
                      : order.status === "OUT_FOR_DELIVERY"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  {order.items.map((item, index) => (
                    <span key={index} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {item.quantity}x {item.name}
                    </span>
                  )).slice(0, 2)}
                  {order.items.length > 2 && (
                    <span className="text-sm text-gray-500">
                      +{order.items.length - 2} more
                    </span>
                  )}
                </div>
                <span className="font-semibold text-gray-900">
                  {(order.totalAmount / 100).toFixed(2)} AED
                </span>
              </div>
            </button>
          ))}
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No orders found in this category
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Order Details */}
      <div className="w-1/2 p-6 bg-gray-50">
        {selectedOrder ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  Order #{selectedOrder.orderId.slice(-8)}
                </h2>
              </div>
              <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Delivery Location */}
            {selectedOrder.customerDetails && (
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h3 className="font-medium mb-3">Delivery Location</h3>
                <div className="text-gray-600">
                  <p className="font-medium">
                    {selectedOrder.customerDetails?.name || "N/A"}
                  </p>
                  <p className="mt-1">
                    {selectedOrder.customerDetails?.address || "N/A"}
                  </p>
                  <p className="mt-2 flex items-center gap-2">
                    <span>📞</span>
                    <span>{selectedOrder.customerDetails?.phone || "N/A"}</span>
                  </p>
                  {selectedOrder.customerDetails?.email && (
                    <p className="mt-1 flex items-center gap-2">
                      <span>📧</span>
                      <span>{selectedOrder.customerDetails.email}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-xl border border-gray-200">
              <h3 className="font-medium p-4 border-b border-gray-100">Order Items</h3>
              {selectedOrder.items.map((item, index) => (
                <div
                  key={index}
                  className={`flex gap-4 p-4 ${
                    index !== selectedOrder.items.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <img
                    src={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/5-${item.id}.jpg`}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {item.description}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          ${item.price.toFixed(2)} × {item.quantity} items
                        </p>
                      </div>
                      <span className="font-medium text-red-600">
                        {(item.price * item.quantity).toFixed(2)} AED
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              {selectedOrder.status === "COOKING" && (
                <form className="mb-6">
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
                      className="flex-1 p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                      required
                    />
                  </div>
                </form>
              )}

              <div className="space-y-2 mb-6">
                <div className="flex justify-between font-semibold text-lg pt-2">
                  <span>Total</span>
                  <span className="text-red-600">
                    {(selectedOrder.totalAmount / 100).toFixed(2)} AED
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                className={`w-full py-3 rounded-lg transition-all duration-200 ${
                  selectedOrder.status === "COMPLETED"
                    ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow"
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
            <div className="text-center">
              <div className="mb-4">
                <ChevronRight className="w-12 h-12 mx-auto text-gray-400" />
              </div>
              <p>Select an order to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}