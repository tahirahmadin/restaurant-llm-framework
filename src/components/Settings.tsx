import React, { useState } from "react";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import MyDropzone from "./MyDropzone";
import { API_URL } from "../config";

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
    latitude: number;
    longitude: number;
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

  const setFileUpload = ({ File, extractedText }: FileState) => {
    if (!restaurantDetails.restaurantId) {
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Menu</h2>
          {restaurantDetails.restaurantId ? (
            <MyDropzone
              FileUpload={{
                File: restaurantDetails.menu?.File || null,
                extractedText: restaurantDetails.menu?.extractedText || "",
              }}
              setFileUpload={setFileUpload}
              onMenuProcessed={handleMenuProcessedInternal}
              restaurantId={restaurantDetails.restaurantId}
            />
          ) : (
            <div className="text-red-500 text-sm mt-2">
              Restaurant ID not found. Please try refreshing the page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
