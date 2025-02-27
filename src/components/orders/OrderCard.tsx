import React from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { OrderItem, Order } from "./types";

interface OrderCardProps {
  order: Order;
  selectedOrder: Order | null;
  onSelect: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  selectedOrder,
  onSelect,
}) => {
  return (
    <motion.button
      onClick={() => onSelect(order)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`w-full p-4 rounded-lg relative overflow-hidden transition-all duration-200 hover:shadow-lg transform hover:scale-[1.01] focus:outline-none ${
        selectedOrder?._id === order._id
          ? "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 border border-red-200"
          : "bg-gradient-to-br from-white via-gray-50/30 to-white border border-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-r opacity-10 transition-opacity duration-200 ${
          selectedOrder?._id === order._id
            ? "from-red-200 to-transparent opacity-20"
            : "from-red-50 to-red-300 group-hover:from-red-100 group-hover:opacity-20"
        }`}
      />
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`font-semibold ${
                selectedOrder?._id === order._id
                  ? "text-red-600"
                  : "text-gray-800"
              }`}
            >
              #{order.orderId}
            </span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-600">
              {order.customerDetails?.name || "N/A"}
            </span>
            {order.estimatedMinutes && (
              <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
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
      <div className="flex justify-between items-center pt-2 mt-2">
        <div className="flex items-center gap-2 flex-wrap">
          {order.items
            .map((item, index) => (
              <div
                key={index}
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedOrder?._id === order._id
                    ? "bg-white/80 text-gray-700"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {item.quantity}x {item.name}
              </div>
            ))
            .slice(0, 2)}
          {order.items.length > 2 && (
            <span className="text-[10px] text-gray-400">
              +{order.items.length - 2} more
            </span>
          )}
        </div>
        <span
          className={`text-sm font-semibold ${
            selectedOrder?._id === order._id ? "text-red-600" : "text-gray-800"
          }`}
        >
          {(order.totalAmount / 100).toFixed(2)} AED
        </span>
      </div>
    </motion.button>
  );
};
