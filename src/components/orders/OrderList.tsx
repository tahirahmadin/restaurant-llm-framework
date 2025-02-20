import React from "react";
import { OrderCard } from "./OrderCard";
import { Order } from "./types";

interface OrderListProps {
  orders: Order[];
  selectedOrder: Order | null;
  onSelectOrder: (order: Order) => void;
  status: "PROCESSING" | "COOKING" | "OUT_FOR_DELIVERY" | "COMPLETED";
  title: string;
  statusColor: string;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  selectedOrder,
  onSelectOrder,
  status,
  title,
  statusColor,
}) => {
  const filteredOrders = orders.filter((order) => order.status === status);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
        {title}
      </h2>
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            selectedOrder={selectedOrder}
            onSelect={onSelectOrder}
          />
        ))}
      </div>
    </div>
  );
};
