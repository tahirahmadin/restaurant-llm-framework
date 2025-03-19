import React, { useState, useEffect } from "react";
import { CreditCard, Store } from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "../store/useAuthStore";
import { updatePaymentOperationModes } from "../actions/serverActions";
import useRestaurantStore from "../store/useRestaurantStore";

interface PaymentModes {
  CRYPTO: boolean;
  STRIPE: boolean;
  COUNTER: boolean;
}

interface OperationModes {
  DINE_IN: boolean;
  DELIVERY: boolean;
}

export function Services() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { profile, isLoading, loadProfile, setProfile } = useRestaurantStore();
  const [paymentModes, setPaymentModes] = useState<PaymentModes>({
    CRYPTO: false,
    STRIPE: false,
    COUNTER: true,
  });
  const [disabledPayments, setDisabledPayments] = useState<{
    CRYPTO: boolean;
    STRIPE: boolean;
  }>({
    CRYPTO: true,
    STRIPE: true,
  });
  const [operationModes, setOperationModes] = useState<OperationModes>({
    DINE_IN: true,
    DELIVERY: true,
  });

  useEffect(() => {
    if (user?.email) {
      loadProfile(user.email);
    }
  }, [user?.email, loadProfile]);

  useEffect(() => {
    if (profile) {
      setPaymentModes(profile.paymentModes);
      setDisabledPayments({
        CRYPTO: !profile.bscBaseDepositAddress,
        STRIPE: !profile.stripeAccountId,
      });
      setOperationModes(profile.operationModes);
    }
  }, [profile]);

  const handleSaveSettings = async () => {
    if (!user?.restaurantId || !user?.username) {
      toast.error("Missing required credentials");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePaymentOperationModes(
        Number(user.restaurantId),
        paymentModes,
        operationModes,
        user.username
      );
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update settings"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen overflow-auto">
      <div className="max-w-3xl mx-auto bg-white">
        <div className="space-y-6">
          {/* Payment Modes */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Modes
              </h2>
            </div>
            <div className="space-y-4">
              {Object.entries(paymentModes).map(([mode, enabled]) => (
                <label
                  key={mode}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {mode.replace("_", " ")}
                    </p>
                    <div>
                      <p className="text-sm text-gray-500">
                        {mode === "CRYPTO" && "Accept cryptocurrency payments"}
                        {mode === "STRIPE" &&
                          "Accept credit/debit card payments"}

                        {mode === "COUNTER" && "Accept cash payments"}
                      </p>
                      {mode === "CRYPTO" && disabledPayments.CRYPTO && (
                        <p className="text-xs text-red-500 mt-1">
                          Set up BSC Base address in Payments to enable
                        </p>
                      )}
                      {mode === "STRIPE" && disabledPayments.STRIPE && (
                        <p className="text-xs text-red-500 mt-1">
                          Complete Stripe KYC in Payments to enable
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() =>
                        (mode === "CRYPTO" && disabledPayments.CRYPTO) ||
                        (mode === "STRIPE" && disabledPayments.STRIPE)
                          ? null
                          : setPaymentModes((prev) => ({
                              ...prev,
                              [mode]: !prev[mode as keyof PaymentModes],
                            }))
                      }
                      disabled={
                        (mode === "CRYPTO" && disabledPayments.CRYPTO) ||
                        (mode === "STRIPE" && disabledPayments.STRIPE)
                      }
                      className="sr-only peer"
                    />
                    <div
                      className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                        (mode === "CRYPTO" && disabledPayments.CRYPTO) ||
                        (mode === "STRIPE" && disabledPayments.STRIPE)
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-gray-200 peer-checked:bg-red-600"
                      }`}
                    ></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Operation Modes */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Store className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Operation Modes
              </h2>
            </div>
            <div className="space-y-4">
              {Object.entries(operationModes).map(([mode, enabled]) => (
                <label
                  key={mode}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {mode.replace("_", " ")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {mode === "DINE_IN" &&
                        "Allow customers to dine in at the restaurant"}
                      {mode === "DELIVERY" && "Enable food delivery service"}
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() =>
                        setOperationModes((prev) => ({
                          ...prev,
                          [mode]: !prev[mode as keyof OperationModes],
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSettings}
            disabled={isSubmitting}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
