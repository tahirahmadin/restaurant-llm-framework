import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Search,
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
  estimatedMinutes?: number;
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
    <div className="flex flex-col items-center justify-center p-2 bg-gray-900 text-white rounded-lg shadow-lg w-48">
      <div className="text-3xl font-bold font-mono">
        {now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
      <div className="text-xs text-gray-400">
        {now.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
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
      const ordersArray = Array.isArray(fetchedOrders) ? fetchedOrders : [];

      const storedTimestampStr = sessionStorage.getItem("lastOrderTimestamp");
      if (storedTimestampStr) {
        const storedTimestamp = Number(storedTimestampStr);
        const newOrders = ordersArray.filter(
          (order) => new Date(order.createdAt).getTime() > storedTimestamp
        );
        if (newOrders.length > 0) {
          toast.success(
            `${newOrders.length} new order${
              newOrders.length > 1 ? "s" : ""
            } received!`
          );
          if (bellAudioRef.current) {
            bellAudioRef.current
              .play()
              .catch((error) => console.error("Failed to play audio:", error));
          }
        }
      }
      if (ordersArray.length > 0) {
        const maxTimestamp = Math.max(
          ...ordersArray.map((o) => new Date(o.createdAt).getTime())
        );
        sessionStorage.setItem("lastOrderTimestamp", maxTimestamp.toString());
      }
      setOrders(ordersArray);
    } catch (error) {
      toast.error("Failed to load orders");
      console.error("Error loading orders:", error);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        setTimeout(() => {
          setLoading(false);
        }, MIN_LOADING_TIME - elapsed);
      } else {
        setLoading(false);
      }
    }
  }, [user?.restaurantId, setOrders]);

  useEffect(() => {
    if (user?.restaurantId) {
      loadOrders();
    }
  }, [user?.restaurantId, loadOrders]);

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await updateOrderStatusAPI(
        order.orderId,
        newStatus as
          | "PROCESSING"
          | "COOKING"
          | "OUT_FOR_DELIVERY"
          | "COMPLETED",
        estimatedMinutes
      );
      if (res) {
        setOrders(res);
        toast.success(`Order ${order.orderId.slice(-8)} ${newStatus}`);
        if (selectedOrder && selectedOrder._id === order._id) {
          setSelectedOrder({ ...order, status: newStatus });
        }
      }
    } catch (error) {
      toast.error("Failed to update order status");
      console.error("Error updating order status:", error);
    } finally {
      setIsUpdating(false);
      setConfirmModal({ visible: false, order: null, newStatus: null });
    }
  };

  const handleStatusChangeRequest = (order: Order, nextStatus: string) => {
    setConfirmModal({ visible: true, order, newStatus: nextStatus });
  };

  const orderList = Array.isArray(orders) ? orders : [];

  const filteredOrders = useMemo(() => {
    let filtered = searchTerm.trim()
      ? orderList.filter(
          (order) =>
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerDetails?.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
      : orderList;

    return [...filtered].sort((a, b) => {
      if (sortOrder === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });
  }, [orderList, searchTerm, sortOrder]);

  const processingOrders = filteredOrders.filter(
    (order) => order.status === "PROCESSING"
  );
  const cookingOrders = filteredOrders.filter(
    (order) => order.status === "COOKING"
  );
  const deliveryOrders = filteredOrders.filter(
    (order) => order.status === "OUT_FOR_DELIVERY"
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your restaurant orders
            </p>
          </div>
          <LiveClock />
        </div>
        {/* Header Controls */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest")
              }
              className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            {/* Manual Refresh Button */}
            <button
              onClick={loadOrders}
              disabled={loading}
              className="p-2 rounded-full bg-[#DA3642] hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh orders"
            >
              <RefreshCcw className="w-5 h-5 text-gray-100" />
            </button>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fresh Orders Column */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              Fresh Orders
              <span className="ml-2 px-2 py-0.5 text-sm bg-yellow-100 text-yellow-700 rounded-full">
                {processingOrders.length}
              </span>
            </h2>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <SkeletonOrderCard key={index} />
                  ))
                : processingOrders.map((order) => (
                    <motion.button
                      key={order._id}
                      onClick={() => setSelectedOrder(order)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`w-full p-4 rounded-lg relative overflow-hidden transition-all duration-200 hover:shadow-lg transform hover:scale-[1.01] focus:outline-none ${
                        selectedOrder?._id === order._id
                          ? "bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
                          : "bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              #{order.orderId.slice(-8)}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
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
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Waiting
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2">
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
            </div>
          </div>

          {/* Cooking Column */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Cooking
              <span className="ml-2 px-2 py-0.5 text-sm bg-red-100 text-red-700 rounded-full">
                {cookingOrders.length}
              </span>
            </h2>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <SkeletonOrderCard key={index} />
                  ))
                : cookingOrders.map((order) => (
                    <motion.button
                      key={order._id}
                      onClick={() => setSelectedOrder(order)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`w-full p-4 rounded-lg relative overflow-hidden transition-all duration-200 hover:shadow-lg transform hover:scale-[1.01] focus:outline-none ${
                        selectedOrder?._id === order._id
                          ? "bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
                          : "bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              #{order.orderId.slice(-8)}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
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
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Cooking
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2">
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
            </div>
          </div>

          {/* Out for Delivery Column */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Out for Delivery
              <span className="ml-2 px-2 py-0.5 text-sm bg-blue-100 text-blue-700 rounded-full">
                {deliveryOrders.length}
              </span>
            </h2>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <SkeletonOrderCard key={index} />
                  ))
                : deliveryOrders.map((order) => (
                    <motion.button
                      key={order._id}
                      onClick={() => setSelectedOrder(order)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`w-full p-4 rounded-lg relative overflow-hidden transition-all duration-200 hover:shadow-lg transform hover:scale-[1.01] focus:outline-none ${
                        selectedOrder?._id === order._id
                          ? "bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
                          : "bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              #{order.orderId.slice(-8)}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
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
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Out for Delivery
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* Right Drawer - Order Details */}
      {selectedOrder && (
        <div className="fixed inset-y-0 right-0 w-[30%] bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto border-l border-gray-200">
          <AnimatePresence mode="wait">
            <motion.div
              key="orderDetails"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 p-6 relative"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Order #{selectedOrder.orderId.slice(-8)}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedOrder.status === "PROCESSING"
                        ? "bg-yellow-100 text-yellow-700"
                        : selectedOrder.status === "COOKING"
                        ? "bg-red-100 text-red-700"
                        : selectedOrder.status === "OUT_FOR_DELIVERY"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {selectedOrder.status.charAt(0).toUpperCase() +
                      selectedOrder.status.slice(1).toLowerCase()}
                  </span>
                  {selectedOrder.estimatedMinutes && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedOrder.estimatedMinutes} mins
                    </span>
                  )}
                </div>
              </div>
              {/* Delivery Location */}
              {selectedOrder.customerDetails && (
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                  <h3 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      🚚
                    </span>
                    Delivery Location
                  </h3>
                  <div className=" text-gray-600">
                    <p className="font-medium text-gray-800">
                      {selectedOrder.customerDetails?.name || "N/A"}
                    </p>
                    <p className="text-sm bg-gray-50 rounded-lg">
                      {selectedOrder.customerDetails?.address || "N/A"}
                    </p>
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        📞
                      </span>
                      <span>
                        {selectedOrder.customerDetails?.phone || "N/A"}
                      </span>
                    </div>
                    {selectedOrder.customerDetails?.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          📧
                        </span>
                        <span>{selectedOrder.customerDetails.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-gradient-to-br from-gray-50 p-6  to-white rounded-xl border border-gray-200">
                <h3 className="font-semibold border-b border-gray-100 text-gray-800 flex items-center gap-2">
                  Order Items
                </h3>
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 p-2 hover:bg-gray-50 transition-colors ${
                      index !== selectedOrder.items.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <img
                      src={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${user?.restaurantId}/${user?.restaurantId}-${item.id}.jpg`}
                      alt={item.name}
                      loading="lazy"
                      className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {item.name}
                          </h3>

                          <p className="text-xs  text-gray-600 rounded-full inline-block">
                            {item.quantity} × AED {item.price.toFixed(2)}
                          </p>
                        </div>
                        <span className="font-semibold text-red-600  px-2 py-0.5 rounded-lg text-sm">
                          {(item.price * item.quantity).toFixed(2)} AED
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
                {selectedOrder.status === "COOKING" && (
                  <form className="mb-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
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
                        className="flex-1 p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-600 text-center font-medium"
                        required
                      />
                    </div>
                  </form>
                )}

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                    <span>Total</span>
                    <span className="text-xl font-bold text-red-600">
                      {(selectedOrder.totalAmount / 100).toFixed(2)} AED
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {selectedOrder.status === "PROCESSING" && (
                    <button
                      onClick={() =>
                        handleStatusChangeRequest(selectedOrder, "COOKING")
                      }
                      disabled={
                        isUpdating || selectedOrder.status !== "PROCESSING"
                      }
                      className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Start Cooking
                    </button>
                  )}

                  {selectedOrder.status === "COOKING" && (
                    <button
                      onClick={() =>
                        handleStatusChangeRequest(
                          selectedOrder,
                          "OUT_FOR_DELIVERY"
                        )
                      }
                      disabled={
                        isUpdating || selectedOrder.status !== "COOKING"
                      }
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Send for Delivery
                    </button>
                  )}

                  {selectedOrder.status === "OUT_FOR_DELIVERY" && (
                    <button
                      onClick={() =>
                        handleStatusChangeRequest(selectedOrder, "COMPLETED")
                      }
                      disabled={
                        isUpdating ||
                        selectedOrder.status !== "OUT_FOR_DELIVERY"
                      }
                      className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.visible && confirmModal.order && confirmModal.newStatus && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"> </div>
          <div className="relative bg-white rounded-xl shadow-lg p-6 w-[400px] max-w-lg mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Status Change
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to change the status of order #
              {confirmModal.order.orderId.slice(-8)} to{" "}
              {confirmModal.newStatus.toLowerCase()}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() =>
                  setConfirmModal({
                    visible: false,
                    order: null,
                    newStatus: null,
                  })
                }
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateOrderStatus(confirmModal.order, confirmModal.newStatus)
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Element for Notifications */}
      <audio
        ref={bellAudioRef}
        src="/bell.mp3"
        preload="auto"
        style={{ display: "none" }}
      />
    </div>
  );
}
