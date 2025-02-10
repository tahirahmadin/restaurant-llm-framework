import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Building2,
  Phone,
  MapPin,
  ImageIcon,
} from "lucide-react";
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
  location?: {
    latitude: number;
    longitude: number;
  };
  isOnline?: boolean;
  menu?: {
    File?: File | null;
    extractedText?: string;
  };
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

const ImageUploader: React.FC<{
  currentImage: string;
  onImageUpdate: (newUrl: string) => void;
  restaurantId: number;
}> = ({ currentImage, onImageUpdate, restaurantId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Image size should be less than 50MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("restaurantId", restaurantId.toString());
      formData.append("itemId", "0");

      // Upload image
      const response = await fetch(`${API_URL}/api/upload/uploadImage`, {
        method: "POST",
        body: formData,
      });

      // Parse response
      const data = await response.json();

      // Check for success
      if (!data.success || !data.fileUrl) {
        throw new Error(data.error || "Upload failed");
      }

      // Update state with new image URL
      onImageUpdate(data.fileUrl);
      setPreviewImage(data.fileUrl);

      // Clean up
      URL.revokeObjectURL(objectUrl);

      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
      setPreviewImage(currentImage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Preview Image */}
      <div className="w-24 h-24 rounded overflow-hidden bg-gray-100">
        {previewImage ? (
          <img
            src={previewImage}
            alt="Restaurant"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Upload Input */}
      <label
        className={`inline-flex items-center px-4 py-2 rounded ${
          isUploading
            ? "bg-gray-200 cursor-not-allowed"
            : "bg-gray-100 hover:bg-gray-200 cursor-pointer"
        }`}
      >
        <span className="text-sm font-medium">
          {isUploading ? "Uploading..." : "Upload Image"}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
      </label>
    </div>
  );
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!restaurantDetails.name?.trim()) {
          newErrors.name = "Restaurant name is required";
        }

        if (!restaurantDetails.contactNo?.trim()) {
          newErrors.contactNo = "Contact number is required";
        } else if (
          !/^\+971 (5\d{8}|4\d{7})$/.test(restaurantDetails.contactNo)
        ) {
          newErrors.contactNo =
            "Enter a valid Dubai contact number (e.g., +971 5XXXXXXXX or +971 4XXXXXXX)";
        }

        if (!restaurantDetails.address?.trim()) {
          newErrors.address = "Address is required";
        }

        if (!restaurantDetails.location) {
          newErrors.location = "Please capture your location";
        }
        break;

      case 2:
        if (!restaurantDetails.menu?.File) {
          newErrors.menu = "Please upload your menu";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(setupStep)) {
      setSetupStep((prev) => prev + 1);
    } else {
      toast.error("Please fill all required fields correctly");
    }
  };

  const handlePrevStep = () => {
    setSetupStep((prev) => prev - 1);
    setErrors({});
  };

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRestaurantDetails((prev) => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
          toast.success("Location captured successfully");
          setErrors((prev) => ({ ...prev, location: "" }));
        },
        (error) => {
          console.error("Error:", error);
          toast.error("Please enable location services");
          setErrors((prev) => ({
            ...prev,
            location: "Failed to capture location",
          }));
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleSaveDetails = async () => {
    if (validateStep(1)) {
      try {
        console.log("Restaurant details before saving:", restaurantDetails);

        const body = {
          name: restaurantDetails.name,
          description: restaurantDetails.description,
          image: restaurantDetails.image,
          contactNo: restaurantDetails.contactNo,
          address: restaurantDetails.address,
          location: restaurantDetails.location,
          isOnline: restaurantDetails.isOnline ?? false,
        };

        let url = `${API_URL}/api/restaurant/createRestaurant`;
        let method = "POST";

        if (restaurantDetails.restaurantId) {
          url = `${API_URL}/api/restaurant/updateRestaurant/${restaurantDetails.restaurantId}`;
          method = "PUT";
        }

        console.log(
          `Sending ${method} request to:`,
          url,
          "with body:",
          JSON.stringify(body)
        );

        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log("Server Response:", data);

        if (!data.success) {
          throw new Error(data.error || "Failed to save restaurant");
        }

        if (data.success && data.data) {
          setRestaurantDetails((prev) => ({
            ...prev,
            restaurantId: data.data.restaurantId,
            menuUploaded: data.data.menuUploaded,
          }));
          handleNextStep();
        }

        toast.success("Restaurant saved successfully!");
      } catch (error: any) {
        console.error("Error saving restaurant details:", error);
        toast.error(error.message || "Failed to save restaurant details");
      }
    } else {
      toast.error("Please fill all required fields correctly");
    }
  };

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

  if (!showSetup) return null;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {restaurantDetails.restaurantId
              ? "Update Restaurant"
              : "Restaurant Setup"}
          </h1>
          <button
            onClick={() => setShowSetup(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center w-full">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                setupStep >= 1 ? "bg-[#ff6b2c] text-white" : "bg-gray-200"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-1 mx-4 ${
                setupStep === 2 ? "bg-[#ff6b2c]" : "bg-gray-200"
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                setupStep === 2 ? "bg-[#ff6b2c] text-white" : "bg-gray-200"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Step 1: Restaurant Details */}
        {setupStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Restaurant Details
            </h2>
            <div className="space-y-4">
              {/* Restaurant Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={restaurantDetails.name}
                    onChange={(e) =>
                      setRestaurantDetails((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className={`pl-10 w-full rounded-lg border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]`}
                    placeholder="Enter restaurant name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Description *
                </label>
                <div className="relative">
                  <textarea
                    required
                    value={restaurantDetails.description || ""}
                    onChange={(e) => {
                      const words = e.target.value.trim().split(/\s+/);
                      if (words.length > 8) {
                        setErrors((prev) => ({
                          ...prev,
                          description: "Keep it within 5-8 words.",
                        }));
                      } else {
                        setErrors((prev) => ({ ...prev, description: "" }));
                        setRestaurantDetails((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                      }
                    }}
                    className={`w-full rounded-lg border ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    } px-4 py-1 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]`}
                    placeholder="One line about your restaurant..."
                    rows={2}
                  />
                </div>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Image
                </label>
                <ImageUploader
                  currentImage={restaurantDetails.image || ""}
                  onImageUpdate={(newUrl) =>
                    setRestaurantDetails((prev) => ({
                      ...prev,
                      image: newUrl,
                    }))
                  }
                  restaurantId={Number(restaurantDetails.restaurantId || 0)}
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    required
                    value={restaurantDetails.contactNo}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const formattedValue = inputValue.startsWith("+971")
                        ? inputValue
                        : "+971 " + inputValue.replace(/[^0-9]/g, "").slice(3); // Ensure it starts with +971

                      // Validate format: +971 5XXXXXXXX (mobile) or +971 4XXXXXXX (landline)
                      const dubaiNumberPattern = /^\+971 (5\d{8}|4\d{7})$/;
                      setRestaurantDetails((prev) => ({
                        ...prev,
                        contactNo: formattedValue,
                      }));

                      setErrors((prev) => ({
                        ...prev,
                        contactNo: dubaiNumberPattern.test(formattedValue)
                          ? ""
                          : "Invalid phone number format",
                      }));
                    }}
                    className={`pl-10 w-full rounded-lg border ${
                      errors.contactNo ? "border-red-500" : "border-gray-300"
                    } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]`}
                    placeholder="+971 5XXXXXXXX"
                  />
                </div>
                {errors.contactNo && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.contactNo}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    required
                    value={restaurantDetails.address}
                    onChange={(e) =>
                      setRestaurantDetails((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className={`pl-10 w-full rounded-lg border ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]`}
                    placeholder="Enter restaurant address"
                    rows={2}
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              {/* Menu Summary */}

              {/* Location */}
              <div>
                <button
                  type="button"
                  onClick={captureLocation}
                  className={`w-full px-4 py-2 ${
                    restaurantDetails.location ? "bg-green-600" : "bg-[#ff6b2c]"
                  } text-white rounded-lg hover:opacity-90`}
                >
                  {restaurantDetails.location
                    ? "📍 Location Captured"
                    : "📍 Get Location"}
                </button>
                {restaurantDetails.location && (
                  <p className="mt-2 text-sm text-gray-600">
                    Location:{" "}
                    {restaurantDetails.location.latitude?.toFixed(6) || "N/A"},{" "}
                    {restaurantDetails.location.longitude?.toFixed(6) || "N/A"}
                  </p>
                )}
                {errors.location && (
                  <p className="mt-1 text-sm text-red-500">{errors.location}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center mt-6 space-x-4">
              {/* <button
                type="button"
                onClick={handleSaveDetails}
                className="px-4 py-2 bg-[#ff6b2c] text-white rounded-lg hover:bg-[#e85a1f]"
              >
                Save
              </button> */}
              <button
                type="button"
                onClick={handleSaveDetails}
                className="px-4 py-2 bg-[#ff6b2c] text-white rounded-lg hover:bg-[#e85a1f]"
              >
                Save & Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload Menu */}
        {setupStep === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Upload Menu
            </h2>
            {restaurantDetails.restaurantId ? (
              <MyDropzone
                FileUpload={{
                  File: restaurantDetails.menu?.File || null,
                  extractedText: restaurantDetails.menu?.extractedText || "",
                }}
                setFileUpload={setFileUpload}
                onMenuProcessed={onMenuProcessed}
                restaurantId={restaurantDetails.restaurantId}
              />
            ) : (
              <div className="text-red-500">
                Please save restaurant details first to get a Restaurant ID
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !restaurantDetails.restaurantId}
                className="ml-auto px-4 py-2 bg-[#ff6b2c] text-white rounded-lg hover:bg-[#e85a1f] disabled:opacity-50"
                onClick={() => setShowSetup(false)}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
