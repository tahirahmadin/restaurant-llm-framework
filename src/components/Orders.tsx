import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { toast } from "sonner";
import useOrderStore from "../store/useOrderStore";
import useAuthStore from "../store/useAuthStore";
import {
  fetchRestaurantOrders,
  updateOrderStatus as updateOrderStatusAPI,
} from "../actions/serverActions";
import { OrdersHeader } from "./orders/OrdersHeader";
import { OrderList } from "./orders/OrderList";
import { OrderDetails } from "./orders/OrderDetails";
import { ConfirmationModal } from "./orders/ConfirmationModal";
import type { Order } from "./orders/types";

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
    deliveryAgentId?: string;
  }>({ visible: false, order: null, newStatus: null });

  // Ensure that orders are initialized as an empty array in your store.
  const { orders, setOrders } = useOrderStore();
  const bellAudioRef = useRef<HTMLAudioElement>(null);

  // Unlock audio context on first user interaction to avoid autoplay blocks.
  useEffect(() => {
    const unlockAudio = () => {
      if (bellAudioRef.current) {
        // Play muted briefly to unlock audio
        bellAudioRef.current.muted = true;
        bellAudioRef.current
          .play()
          .then(() => {
            bellAudioRef.current!.pause();
            bellAudioRef.current!.muted = false;
            console.log("Audio context unlocked");
          })
          .catch((err) => console.error("Audio unlock failed:", err));
      }
    };

    document.addEventListener("click", unlockAudio, { once: true });
    return () => {
      document.removeEventListener("click", unlockAudio);
    };
  }, []);

  // Function to load orders; ensures the result is always an array.
  const loadOrders = useCallback(async () => {
    if (!user?.email) {
      toast.error("User email not found");
      return;
    }
    setLoading(true);
    const MIN_LOADING_TIME = 1000;
    const startTime = Date.now();
    try {
      const fetchedOrders = await fetchRestaurantOrders(user.email);
      // Always treat fetchedOrders as an array.
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
        setTimeout(() => setLoading(false), MIN_LOADING_TIME - elapsed);
      } else {
        setLoading(false);
      }
    }
  }, [user?.restaurantId, setOrders]);

  // Initial order load when restaurantId is available.
  useEffect(() => {
    if (user?.restaurantId) {
      loadOrders();
    }
  }, [user?.restaurantId, loadOrders]);

  // WebSocket integration for live updates.
  useEffect(() => {
    if (!user?.restaurantId) return;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 seconds
    let ws: WebSocket;
    let pingInterval: number;

    function connect() {
      let socketUrl = import.meta.env.VITE_PUBLIC_BACKEND_SOCKET_URL;
      ws = new WebSocket(socketUrl);
      ws.onopen = () => {
        console.log("Connected to WebSocket server");
        reconnectAttempts = 0;
        // Set a heartbeat ping every 30 seconds.
        pingInterval = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        console.log("Received message:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === "orderCreated" && data.order) {
            console.log("New order created:", data.order);
            // Reload orders upon receiving a new order.
            loadOrders();
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      const handleReconnection = () => {
        clearInterval(pingInterval);
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(
            `Reconnecting... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`
          );
          setTimeout(connect, reconnectDelay);
        } else {
          console.error("Max reconnection attempts reached");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        handleReconnection();
      };

      ws.onclose = (event) => {
        console.log(
          "Disconnected from WebSocket server:",
          event.code,
          event.reason
        );
        handleReconnection();
      };
    }

    connect();

    // Clean up the connection on component unmount.
    return () => {
      if (ws) {
        ws.close();
      }
      clearInterval(pingInterval);
    };
  }, [user?.restaurantId, loadOrders]);

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    setIsUpdating(true);
    try {
      const deliveryAgentId = confirmModal.deliveryAgentId;
      const res = await updateOrderStatusAPI(
        order.orderId,
        newStatus as
          | "PROCESSING"
          | "COOKING"
          | "OUT_FOR_DELIVERY"
          | "COMPLETED",
        estimatedMinutes,
        deliveryAgentId
      );
      if (res) {
        setOrders(res);
        toast.success(`Order ${order.orderId} ${newStatus}`);
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

  const handleStatusChangeRequest = (
    order: Order,
    nextStatus: string,
    deliveryAgentId?: string
  ) => {
    setConfirmModal({
      visible: true,
      order,
      newStatus: nextStatus,
      deliveryAgentId,
    });
  };

  // Ensure orders is always treated as an array.
  const filteredOrders = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    let filtered = searchTerm.trim()
      ? safeOrders.filter(
          (order) =>
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerDetails?.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
      : safeOrders;

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [orders, searchTerm, sortOrder]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <OrdersHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onRefresh={loadOrders}
          loading={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OrderList
            orders={filteredOrders}
            selectedOrder={selectedOrder}
            onSelectOrder={setSelectedOrder}
            status="PROCESSING"
            title="Fresh Orders"
            statusColor="bg-yellow-400"
          />
          <OrderList
            orders={filteredOrders}
            selectedOrder={selectedOrder}
            onSelectOrder={setSelectedOrder}
            status="COOKING"
            title="Cooking"
            statusColor="bg-red-500"
          />
          <OrderList
            orders={filteredOrders}
            selectedOrder={selectedOrder}
            onSelectOrder={setSelectedOrder}
            status="OUT_FOR_DELIVERY"
            title="Out for Delivery"
            statusColor="bg-blue-500"
          />
        </div>
      </div>

      {selectedOrder && (
        <OrderDetails
          selectedOrder={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          isUpdating={isUpdating}
          estimatedMinutes={estimatedMinutes}
          setEstimatedMinutes={setEstimatedMinutes}
          handleStatusChangeRequest={handleStatusChangeRequest}
          restaurantId={user?.restaurantId || 0}
        />
      )}

      <ConfirmationModal
        visible={confirmModal.visible}
        order={confirmModal.order}
        newStatus={confirmModal.newStatus}
        onConfirm={() => {
          if (confirmModal.order && confirmModal.newStatus) {
            updateOrderStatus(confirmModal.order, confirmModal.newStatus);
          }
        }}
        onCancel={() =>
          setConfirmModal({ visible: false, order: null, newStatus: null })
        }
      />

      <audio ref={bellAudioRef} src="/bell.mp3" />
    </div>
  );
}
