import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { API_URL } from "../config";
import useAuthStore from "../store/useAuthStore";
import { Clock, CheckCircle2, ArrowRight, Wallet, Eye, EyeOff } from "lucide-react";
import { getRestaurantProfile, updateSolanaDepositAddress } from "../actions/serverActions";

export function Payments() {
  const { user, solanaAddress: storedAddress, setSolanaAddress: setStoredAddress } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [linkExpiry, setLinkExpiry] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState(storedAddress || "");
  const [isEditingSolana, setIsEditingSolana] = useState(false);
  const [showSolanaAddress, setShowSolanaAddress] = useState(false);

  useEffect(() => {
    setEditingAddress(storedAddress || "");
  }, [storedAddress]);


  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.restaurantId) {
        toast.error("Restaurant ID not found");
        return;
      }

      try {
        const profile = await getRestaurantProfile(user.restaurantId);
        setPaymentsEnabled(profile.paymentsEnabled);

        if (profile.solanaAddress) {
          setSolanaAddress(profile.solanaAddress);
          setIsEditingSolana(false);
        }else {
          setIsEditingSolana(true);  
        }
      } catch (error) {
        toast.error("Failed to load restaurant profile");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.restaurantId, setStoredAddress]);

  const handleSaveSolanaAddress = async () => {
    if (!user?.restaurantId || !user?.username) {
      toast.error("Restaurant ID or admin username not found");
      return;
    }

    try {
      if (!editingAddress) {
        toast.error("Please enter a valid Solana address");
        return;
      }

      await updateSolanaDepositAddress(
        user.restaurantId,
        editingAddress,
        user.username
      );
      setStoredAddress(editingAddress);
      toast.success("Solana address saved successfully");
      setIsEditingSolana(false);
    } catch (error) {
      console.error("Error updating Solana address:", error);
      toast.error("Failed to update Solana address");
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
      toast.error(
        error instanceof Error ? error.message : "Failed to get KYC link"
      );
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

  if (isLoadingProfile) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading payment status...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Payments</h1>
            <p className="text-gray-500 mt-1">Manage your payment settings</p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="space-y-6">
          {/* KYC Status Card */}
          <div className="bg-gradient-to-br from-gray-50 to-red-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-medium mb-4">Payment KYC Status</h2>

            {paymentsEnabled ? (
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
                  disabled={isLoading || paymentsEnabled}
                  className={`w-full py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2
                    ${
                      isLoading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : paymentsEnabled
                        ? "bg-green-100 text-green-600 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : paymentsEnabled ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      KYC Verified
                    </>
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

          {/* Solana Address Section */}
          <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-medium mb-4">Solana Deposit Address</h2>
            
            {isEditingSolana ? (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showSolanaAddress ? "text" : "password"}
                    value={editingAddress}
                    onChange={(e) => setEditingAddress(e.target.value)}
                    placeholder="Enter your Solana deposit address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSolanaAddress(!showSolanaAddress)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSolanaAddress ? 
                      <EyeOff className="w-5 h-5" /> : 
                      <Eye className="w-5 h-5" />
                    }
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSolanaAddress}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Address
                  </button>
                  {storedAddress && (
                    <button
                      onClick={() => {
                        setIsEditingSolana(false);
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
                  {showSolanaAddress ? storedAddress : '••••••••' + storedAddress.slice(-4)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSolanaAddress(!showSolanaAddress)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    {showSolanaAddress ? 
                      <EyeOff className="w-5 h-5" /> : 
                      <Eye className="w-5 h-5" />
                    }
                  </button>
                  <button
                    onClick={() => setIsEditingSolana(true)}
                    className="px-4 py-2 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingSolana(true)}
                className="w-full py-3 px-4 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                Add Solana Address
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
