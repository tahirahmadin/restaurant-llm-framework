import React, { useState } from "react";
import { toast } from "sonner";
import { API_URL } from "../config";
import useAuthStore from "../store/useAuthStore";
import { Clock } from "lucide-react";

export function Payments() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [linkExpiry, setLinkExpiry] = useState<number | null>(null);

  const handleGetKYC = async () => {
    if (!user?.restaurantId) {
      toast.error("Restaurant ID not found");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/payment/getRestaurantOnboardingLink?restaurantId=${user.restaurantId}`
      );

      if (!response.ok) {
        throw new Error("Failed to get KYC link");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Store expiry time and open link
      if (data.result.expires_at) {
        setLinkExpiry(data.result.expires_at);
      }

      if (data.result.url) {
        window.open(data.result.url, "_blank");
      }
    } catch (error) {
      console.error("Error getting KYC link:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get KYC link");
    } finally {
      setIsLoading(false);
    }
  };

  // Format remaining time
  const getRemainingTime = () => {
    if (!linkExpiry) return null;
    const now = Math.floor(Date.now() / 1000);
    const remaining = linkExpiry - now;
    if (remaining <= 0) return null;
    return Math.floor(remaining / 60); // Convert to minutes
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Payments</h1>
            <p className="text-gray-500 mt-1">Manage your payment settings</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-4">Payment KYC</h2>
            <p className="text-gray-600 mb-2">
              Complete your KYC verification to start accepting payments.
            </p>
            {linkExpiry && getRemainingTime() && (
              <div className="flex items-center gap-2 text-sm text-orange-600 mb-4">
                <Clock className="w-4 h-4" />
                <span>Link expires in {getRemainingTime()} minutes</span>
              </div>
            )}
            <button
              onClick={handleGetKYC}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  linkExpiry && getRemainingTime()
                    ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                    : "bg-red-600 text-white hover:bg-red-700"
                }
              `}
              title={linkExpiry && getRemainingTime() ? "A link is already active" : ""}
              aria-disabled={!!(linkExpiry && getRemainingTime())}
            >
              {isLoading ? "Loading..." : "Get Payment KYC"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}