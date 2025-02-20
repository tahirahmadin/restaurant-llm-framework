import React from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Order } from "./types";

interface OrderDetailsProps {
  selectedOrder: Order;
  onClose: () => void;
  isUpdating: boolean;
  estimatedMinutes: number;
  setEstimatedMinutes: (minutes: number) => void;
  handleStatusChangeRequest: (order: Order, newStatus: string) => void;
  restaurantId: string | number;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({
  selectedOrder,
  onClose,
  isUpdating,
  estimatedMinutes,
  setEstimatedMinutes,
  handleStatusChangeRequest,
  restaurantId,
}) => {
  return (
    <div className="fixed inset-y-0 right-0 w-[30%] bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key="orderDetails"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Order #{selectedOrder.orderId.slice(-8)}
            </h2>
            <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
              {new Date(selectedOrder.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Customer Details */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-medium mb-3 text-gray-800">Customer Details</h3>
            <div className="text-gray-600">
              <p className="font-medium">
                {selectedOrder.customerDetails?.name || "N/A"}
              </p>
              <p className="mt-1">
                {selectedOrder.customerDetails?.address || "N/A"}
              </p>
              <p className="mt-2">
                📞 {selectedOrder.customerDetails?.phone || "N/A"}
              </p>
              {selectedOrder.customerDetails?.email && (
                <p className="mt-1">📧 {selectedOrder.customerDetails.email}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-medium p-4 border-b border-gray-100">
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
                  src={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${restaurantId}/${restaurantId}-${item.id}.jpg`}
                  alt={item.name}
                  loading="lazy"
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
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            {selectedOrder.status === "COOKING" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Delivery Time (minutes)
                </label>
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
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2">
              <span>Total</span>
              <span className="text-red-600">
                {(selectedOrder.totalAmount / 100).toFixed(2)} AED
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {selectedOrder.status === "PROCESSING" && (
              <button
                onClick={() =>
                  handleStatusChangeRequest(selectedOrder, "COOKING")
                }
                disabled={isUpdating}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Start Cooking"
                )}
              </button>
            )}

            {selectedOrder.status === "COOKING" && (
              <button
                onClick={() =>
                  handleStatusChangeRequest(selectedOrder, "OUT_FOR_DELIVERY")
                }
                disabled={isUpdating}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Send for Delivery"
                )}
              </button>
            )}

            {selectedOrder.status === "OUT_FOR_DELIVERY" && (
              <button
                onClick={() =>
                  handleStatusChangeRequest(selectedOrder, "COMPLETED")
                }
                disabled={isUpdating}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Mark as Completed"
                )}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
