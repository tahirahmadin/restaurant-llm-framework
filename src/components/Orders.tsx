import React, { useState, useEffect, useMemo, useRef } from "react";
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
  }>({ visible: false, order: null, newStatus: null });

  const { orders, setOrders } = useOrderStore();
  const bellAudioRef = useRef<HTMLAudioElement>(null);

  const loadOrders = async () => {
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
        setTimeout(() => setLoading(false), MIN_LOADING_TIME - elapsed);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user?.restaurantId) {
      loadOrders();
    }
  }, [user?.restaurantId]);

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

  const filteredOrders = useMemo(() => {
    let filtered = searchTerm.trim()
      ? orders.filter(
          (order) =>
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerDetails?.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
      : orders;

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
