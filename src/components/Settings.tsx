import React, { useState } from "react";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import MyDropzone from "./MyDropzone";
import useAuthStore from "../store/useAuthStore";

interface FileState {
  File: File | null;
  extractedText?: string;
}

interface RestaurantDetails {
  restaurantId?: number;
  name: string;
  description: string;
  image: string;
  contactNo: string;
  address: string;
  menuSummary?: string;
  location?: {
    longitude: number;
    latitude: number;
  };
  isOnline?: boolean;
  menu?: {
    File?: File | null;
    extractedText?: string;
  };
  menuUploaded?: boolean;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  spicinessLevel: number;
  sweetnessLevel: number;
  dietaryPreference: string[];
  healthinessScore: number;
  caffeineLevel: string;
  sufficientFor: number;
  available: boolean;
}

interface SettingsProps {
  showSetup: boolean;
  setShowSetup: (show: boolean) => void;
  setupStep: number;
  setSetupStep: (step: number) => void;
  restaurantDetails: RestaurantDetails;
  setRestaurantDetails: (details: RestaurantDetails) => void;
  onMenuProcessed: (data: MenuItem[]) => void;
}

const updatePaymentOperationModes = async (
  restaurantId: number,
  paymentModes: PaymentModes,
  operationModes: OperationModes,
  adminUsername: string
) => {
  try {
    const response = await fetch(
      `${API_URL}/restaurant/updatePaymentOperationModes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId,
          paymentModes,
          operationModes,
          adminUsername,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update settings");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export function Settings({
  showSetup,
  setShowSetup,
  setupStep,
  setSetupStep,
  restaurantDetails,
  setRestaurantDetails,
  onMenuProcessed,
}: SettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const setFileUpload = ({ File, extractedText }: FileState) => {
    if (!user?.adminId) {
      toast.error("Please complete restaurant registration first");
      return;
    }
    setRestaurantDetails((prev) => ({
      ...prev,
      menu: { File, extractedText },
    }));
    toast.success("Menu file uploaded. Processing will begin...");
  };

  const handleMenuProcessedInternal = (data: MenuItem[]) => {
    onMenuProcessed(data);
    setRestaurantDetails((prev) => ({ ...prev, menuUploaded: true }));
  };

  if (!showSetup) return null;

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen overflow-auto">
      <div className="max-w-3xl mx-auto bg-white">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upload Menu
          </h2>
          {user?.adminId ? (
            <MyDropzone
              FileUpload={{
                File: restaurantDetails.menu?.File || null,
                extractedText: restaurantDetails.menu?.extractedText || "",
              }}
              setFileUpload={setFileUpload}
              onMenuProcessed={handleMenuProcessedInternal}
              restaurantId={user.restaurantId}
            />
          ) : (
            <div className="text-red-500 text-sm mt-2">
              Admin ID not found. Please try refreshing the page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
