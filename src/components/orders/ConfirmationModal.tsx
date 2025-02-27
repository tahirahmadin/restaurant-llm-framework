import React from "react";
import { Order } from "./types";

interface ConfirmationModalProps {
  visible: boolean;
  order: Order | null;
  newStatus: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  order,
  newStatus,
  onConfirm,
  onCancel,
}) => {
  if (!visible || !order || !newStatus) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative bg-white rounded-xl shadow-lg p-6 w-[400px] max-w-lg mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Confirm Status Change
        </h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to change the status of order #{order.orderId}{" "}
          to {newStatus.toLowerCase()}?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
