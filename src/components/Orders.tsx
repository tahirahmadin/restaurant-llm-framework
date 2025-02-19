import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Search,
  Filter,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCcw,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  id?: string;
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-red-100 to-red-200 rounded-lg shadow-md">
      <Clock className="w-5 h-5 text-red-600" />
      <div className="text-red-800 font-semibold text-sm">
        {now.toLocaleDateString()} |{" "}
        {now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
    </div>
  );
}

const SkeletonOrderCard = () => (
  <div className="animate-pulse p-4 rounded-xl bg-gray-200">
    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-300 rounded w-1/3"></div>
  </div>
);

export function Orders() {
  const { user } = useAuthStore();
  const [activeStatus, setActiveStatus] = useState<
    "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED"
  >("PROCESSING");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    order: Order | null;
    newStatus: string | null;
  }>({ visible: false, order: null, newStatus: null });

  const { orders, setOrders } = useOrderStore();
  const bellAudioRef = useRef<HTMLAudioElement>(null);

  const loadOrders = useCallback(async () => {
    if (!user?.restaurantId) {
      toast.error("Restaurant ID not found");
      return;
    }
    setLoading(true);
    const MIN_LOADING_TIME = 1000; 
    const startTime = Date.now();
    try {
      const fetchedOrders = await fetchRestaurantOrders(user.restaurantId);
      console.log(fetchedOrders);

      const newOrders = fetchedOrders.filter(
        (order) => !orders.some((existing) => existing._id === order._id)
      );
      
      setOrders(fetchedOrders);
      
      if (newOrders.length > 0) {
        toast.success(`${newOrders.length} new order${newOrders.length > 1 ? "s" : ""} received!`);
        if (bellAudioRef.current) {
          bellAudioRef.current
            .play()
            .catch((error) => console.error("Failed to play audio:", error));
        }
      }
    } catch (error) {
      toast.error("Failed to load orders");
      console.error("Error loading orders:", error);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        setTimeout(() => setLoading(false), MIN_LOADING_TIME - elapsed);
      } else {
        setLoading(false);
      }
    }
  }, [user?.restaurantId, orders, setOrders]);

  // useEffect(() => {
  //   loadOrders();
  // }, [loadOrders]);

  const updateOrderStatus = (order: Order, newStatus: string) => {
    setIsUpdating(true);
    updateOrderStatusAPI(
      order.orderId,
      newStatus as "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED",
      estimatedMinutes
    )
      .then((res) => {
        if (res) {
          console.log(res);
          setOrders(res);
          toast.success(`Order ${order.orderId.slice(30, 40)} ${newStatus}`);
          if (selectedOrder && selectedOrder._id === order._id) {
            setSelectedOrder({ ...order, status: newStatus });
          }
          setActiveStatus(
            newStatus as "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED"
          );
        }
      })
      .catch((error) => {
        toast.error("Failed to update order status");
        console.error("Error updating order status:", error);
      })
      .finally(() => {
        setIsUpdating(false);
        setConfirmModal({ visible: false, order: null, newStatus: null });
      });
  };

  const handleStatusChangeRequest = (order: Order, nextStatus: string) => {
    setConfirmModal({ visible: true, order, newStatus: nextStatus });
  };

  const filteredOrders = useMemo(() => {
    let filtered = searchTerm.trim()
      ? orders.filter(
          (order) =>
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerDetails?.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
      : orders.filter((order) => order.status === activeStatus);

    return [...filtered].sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });
  }, [orders, searchTerm, activeStatus, sortOrder]);

  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row h-full bg-gray-100">
        {/* Sidebar / Header Controls */}
        <div className="w-full md:w-1/2 p-6 border-r border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 transition-all duration-300">
                Orders
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your restaurant orders
              </p>
            </div>
            
            {/* Render the  LiveClock */}
            <LiveClock />
          </div>
          <div className="flex items-center space-x-3 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors duration-200 bg-white text-gray-900"
              />
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={loadOrders}
              disabled={loading}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 focus:outline-none"
              aria-label="Refresh orders"
              title="Refresh orders"
            >
              <RefreshCcw className="w-5 h-5 text-gray-600" />
            </button>
            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest")
              }
              className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors bg-white text-gray-900"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Status Tabs or Search Results Label */}
          {!searchTerm.trim() ? (
            <div className="flex gap-4 mb-6 overflow-x-auto no-scrollbar pb-2">
              {["PROCESSING", "COOKING", "OUT_FOR_DELIVERY", "COMPLETED"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status as any)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                      activeStatus === status
                        ? "bg-red-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {status === "PROCESSING"
                      ? "Fresh Orders"
                      : status === "OUT_FOR_DELIVERY"
                      ? "Out for Delivery"
                      : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="mb-6 text-gray-600 italic">
              Showing search results for “{searchTerm}”
            </div>
          )}

          {/* Orders List */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonOrderCard key={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] no-scrollbar px-1">
              <AnimatePresence>
                {filteredOrders.map((order) => (
                  <motion.button
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full p-4 rounded-xl relative overflow-hidden transition-all duration-200 hover:shadow-lg transform hover:scale-[1.01] focus:outline-none ${
                      selectedOrder?._id === order._id
                        ? "bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
                        : "bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50 border border-gray-200"
                    }`}
                  >
                    {/* Status Indicator */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        order.status === "PROCESSING"
                          ? "bg-yellow-400"
                          : order.status === "COOKING"
                          ? "bg-red-500"
                          : order.status === "OUT_FOR_DELIVERY"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                    />
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            #{order.orderId.slice(-8)}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
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
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.items
                          .map((item, index) => (
                            <span
                              key={index}
                              className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                            >
                              {item.quantity}x {item.name}
                            </span>
                          ))
                          .slice(0, 2)}
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
                  </motion.button>
                ))}
              </AnimatePresence>
              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No orders found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Order Details */}
        <div className="w-full md:w-1/2 p-6 bg-gray-50 mt-6 md:mt-0 relative">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div
                key="orderDetails"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Mobile Back Button */}
                <div className="md:hidden mb-4">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex items-center text-red-600 hover:text-red-700 focus:outline-none"
                    title="Back to orders"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180 mr-1" />
                    Back to Orders
                  </button>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order #{selectedOrder.orderId.slice(-8)}
                  </h2>
                  <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Delivery Location */}
                {selectedOrder.customerDetails && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-200">
                    <h3 className="font-medium mb-3 text-gray-800">
                      Delivery Location
                    </h3>
                    <div className="text-gray-600">
                      <p className="font-medium">
                        {selectedOrder.customerDetails?.name || "N/A"}
                      </p>
                      <p className="mt-1">
                        {selectedOrder.customerDetails?.address || "N/A"}
                      </p>
                      <p className="mt-2 flex items-center gap-2">
                        <span>📞</span>
                        <span>
                          {selectedOrder.customerDetails?.phone || "N/A"}
                        </span>
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200">
                  <h3 className="font-medium p-4 border-b border-gray-100 text-gray-800">
                    Order Items
                  </h3>
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 p-4 ${
                        index !== selectedOrder.items.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <img
                        src={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${user?.restaurantId}/${user?.restaurantId}-${item.id}.jpg`}
                        alt={item.name}
                        loading="lazy"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {item.description}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              AED {item.price.toFixed(2)} × {item.quantity} items
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
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-200">
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
                          className="flex-1 p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors bg-white text-gray-900"
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
                  {/* Action Button */}
                  <button
                    className={`w-full py-3 rounded-lg transition-all duration-200 flex justify-center items-center ${
                      selectedOrder.status === "COMPLETED" || isUpdating
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
                      handleStatusChangeRequest(selectedOrder, nextStatus);
                    }}
                    disabled={selectedOrder.status === "COMPLETED" || isUpdating}
                  >
                    {isUpdating && (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    )}
                    {selectedOrder.status === "PROCESSING"
                      ? "Start Cooking"
                      : selectedOrder.status === "COOKING"
                      ? "Send for Delivery"
                      : selectedOrder.status === "OUT_FOR_DELIVERY"
                      ? "Mark as Completed"
                      : "Order Completed"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="noOrderSelected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center text-gray-500"
              >
                <div className="text-center">
                  <div className="mb-4">
                    <ChevronRight className="w-12 h-12 mx-auto text-gray-400" />
                  </div>
                  <p>Select an order to view details</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmModal.visible &&
            confirmModal.order &&
            confirmModal.newStatus && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
              >
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Confirm Update
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to update order #
                    {confirmModal.order.orderId.slice(-8)} to{" "}
                    {confirmModal.newStatus}?
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() =>
                        setConfirmModal({
                          visible: false,
                          order: null,
                          newStatus: null,
                        })
                      }
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        confirmModal.order &&
                        confirmModal.newStatus &&
                        updateOrderStatus(
                          confirmModal.order,
                          confirmModal.newStatus
                        )
                      }
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
        <audio
          ref={bellAudioRef}
          src="/bell.mp3"
          preload="auto"
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
