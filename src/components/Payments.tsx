import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { API_URL } from "../config";
import useAuthStore from "../store/useAuthStore";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getRestaurantProfile,
  updateBSCBaseDepositAddress,
} from "../actions/serverActions";

export function Payments() {
  const {
    user,
    adminId,
    bscBaseAddress: storedAddress,
    setBSCBaseAddress: setStoredAddress,
  } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [linkExpiry, setLinkExpiry] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState(storedAddress || "");
  const [isEditingBSCBase, setIsEditingBSCBase] = useState(false);
  const [showBSCBaseAddress, setShowBSCBaseAddress] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);

  useEffect(() => {
    setEditingAddress(storedAddress || "");
  }, [storedAddress]);

  // Function to load restaurant profile
  const loadProfile = async () => {
    if (!adminId) {
      toast.error("Restaurant ID not found");
      return;
    }
    try {
      const profile = await getRestaurantProfile(adminId);
      setPaymentsEnabled(profile.paymentsEnabled);
      setStripeAccountId(profile.stripeAccountId || null);

      if (profile.bscBaseAddress) {
        setStoredAddress(profile.bscBaseAddress);
        setIsEditingBSCBase(false);
      } else {
        setIsEditingBSCBase(true);
      }
    } catch (error) {
      toast.error("Failed to load restaurant profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [adminId, setStoredAddress]);

  const handleSaveBSCBaseAddress = async () => {
    if (!user?.restaurantId || !user?.username) {
      toast.error("Restaurant ID or admin username not found");
      return;
    }

    try {
      if (!editingAddress) {
        toast.error("Please enter a valid BSC Base address");
        return;
      }

      await updateBSCBaseDepositAddress(
        user.restaurantId,
        editingAddress,
        user.username
      );
      setStoredAddress(editingAddress);
      toast.success("BSC Base address saved successfully");
      setIsEditingBSCBase(false);
    } catch (error) {
      console.error("Error updating BSC Base address:", error);
      toast.error("Failed to update BSC Base address");
    }
  };

  const handleGetKYC = async () => {
    if (!user?.restaurantId) {
      toast.error("Restaurant ID not found");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/payment/getRestaurantOnboardingLink?restaurantId=${user.restaurantId}`
      );

      if (!response.ok) {
        throw new Error("Failed to get KYC link");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.result.expires_at) {
        setLinkExpiry(data.result.expires_at);
      }

      if (data.result.url) {
        window.open(data.result.url, "_blank");
      }
    } catch (error) {
      console.error("Error getting KYC link:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to get KYC link"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirectToStripe = () => {
    window.open("https://dashboard.stripe.com/", "_blank");
  };

  const getRemainingTime = () => {
    if (!linkExpiry) return null;
    const now = Math.floor(Date.now() / 1000);
    const remaining = linkExpiry - now;
    if (remaining <= 0) return null;
    return Math.floor(remaining / 60);
  };

  if (isLoadingProfile) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading payment status...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Payment setup
          </h1>
          <p className="text-sm text-gray-500">Manage your payment settings</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 mt-3">
        <div className="space-y-6">
          {/* KYC Status Card */}
          <div className="bg-gradient-to-br from-gray-50 to-red-50 p-6 rounded-xl border border-gray-200">
            <div className="flex items-center mb-3 p-2">
              <div className="bg-red-200 rounded-lg p-1">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2534/2534204.png"
                  className="h-12 w-12"
                />
              </div>
              <div className="ml-3">
                <h2 className="text-xl font-medium ">Know your customer</h2>
                <p className="text-sm text-orange-500 ">• Pending</p>
              </div>
            </div>

            {paymentsEnabled ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700">
                      KYC Verification Complete
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Your restaurant is ready to accept payments
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRedirectToStripe}
                  className="w-full py-3 px-4 rounded-lg bg-[#000000] text-white hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  Go to Stripe Dashboard
                </button>
              </div>
            ) : stripeAccountId ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your KYC process is already in progress. Please check your
                  Stripe Dashboard for more details.
                </p>
                <button
                  onClick={handleRedirectToStripe}
                  className="w-full py-3 px-4 rounded-lg bg-[#000000] text-white hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  Go to Stripe Dashboard
                </button>
                <p className="text-xs text-gray-500">
                  Please refresh the page to check for any updates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Complete your KYC verification to start accepting payments
                  through our platform.
                </p>

                {linkExpiry && getRemainingTime() ? (
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Link expires in {getRemainingTime()} minutes
                    </span>
                  </div>
                ) : null}

                <button
                  onClick={handleGetKYC}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2
                    ${
                      isLoading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : (
                    <>
                      Start KYC Process
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* BSC Base Address Section */}
          <div className="bg-gradient-to-br from-gray-50 to-red-50 p-6 rounded-xl border border-gray-200">
            <div className="flex items-center mb-3 p-2">
              <div className="bg-red-200 rounded-lg p-1">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/10002/10002627.png"
                  className="h-12 w-12 "
                />
              </div>
              <div className="ml-3">
                <h2 className="text-xl font-medium ">
                  BSC/BASE Deposit Address
                </h2>
              </div>
            </div>

            {isEditingBSCBase ? (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showBSCBaseAddress ? "text" : "password"}
                    value={editingAddress}
                    onChange={(e) => setEditingAddress(e.target.value)}
                    placeholder="Enter your BSC Base deposit address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-purple-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBSCBaseAddress(!showBSCBaseAddress)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showBSCBaseAddress ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBSCBaseAddress}
                    className="px-4 py-2 bg-[#000000] text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Save Address
                  </button>
                  {storedAddress && (
                    <button
                      onClick={() => {
                        setIsEditingBSCBase(false);
                        setEditingAddress(storedAddress);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : storedAddress ? (
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex-1 break-all">
                  {showBSCBaseAddress
                    ? storedAddress
                    : "••••••••" + storedAddress.slice(-4)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBSCBaseAddress(!showBSCBaseAddress)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    {showBSCBaseAddress ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditingBSCBase(true)}
                    className="px-4 py-2 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingBSCBase(true)}
                className="w-full py-3 px-4 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                Add BSC Base Address
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Additional Payment Info */}
          {paymentsEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-medium mb-2">Payment Methods</h3>
                <p className="text-sm text-gray-600">
                  You can accept payments via credit cards, debit cards, and
                  digital wallets.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-medium mb-2">Settlement Timeline</h3>
                <p className="text-sm text-gray-600">
                  Payments are settled within 2-3 business days to your
                  registered bank account.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
