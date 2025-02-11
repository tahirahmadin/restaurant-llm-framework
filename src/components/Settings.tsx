import React, { useState } from "react";
import {
  Building2,
  Phone,
  MapPin,
  ImageIcon,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import MyDropzone from "./MyDropzone";
import { API_URL } from "../config";

// --- Interfaces (unchanged) ---
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

interface ImageUploaderProps {
  currentImage: string;
  onImageUpdate: (newUrl: string) => void;
  restaurantId: number;
  onFileSelect: (file: File) => void;
}

// --- Improved Image Uploader Component ---
const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageUpdate,
  restaurantId,
  onFileSelect,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);

    // Store the file for later upload
    onFileSelect(file);
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:space-x-6 space-y-4 md:space-y-0">
      {/* Preview Image Area */}
      <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 shadow-sm">
        {previewImage ? (
          <img
            src={previewImage}
            alt="Restaurant"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <ImageIcon className="w-10 h-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-400">No image uploaded</p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <label className="cursor-pointer inline-flex items-center px-6 py-3 rounded-md bg-[#ff6b2c] text-white text-sm font-medium hover:bg-[#e85a1f] transition-all">
        <span>Upload Image</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
};

// --- Main Settings Component ---
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // --- Validation ---
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

  // --- Navigation Handlers ---
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

  // --- Location Capture ---
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

  // --- Save Restaurant Details ---
  const handleSaveDetails = async () => {
    if (!validateStep(1)) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    setIsSubmitting(true);
    let imageUrl = restaurantDetails.image;

    try {
      // Prepare request body
      const body = {
        name: restaurantDetails.name.trim(),
        description: restaurantDetails.description?.trim() || "",
        ...(restaurantDetails.restaurantId && { image: imageUrl }),
        contactNo: restaurantDetails.contactNo.trim(),
        address: restaurantDetails.address.trim(),
        location: restaurantDetails.location,
        isOnline: restaurantDetails.isOnline ?? false,
      };

      const isUpdate = !!restaurantDetails.restaurantId;
      const url = isUpdate
        ? `${API_URL}/api/restaurant/updateRestaurant/${restaurantDetails.restaurantId}`
        : `${API_URL}/api/restaurant/createRestaurant`;
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();

      if (!responseText.trim()) {
        throw new Error(
          `Server returned an empty response (Status: ${response.status})`
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse server response:", e);
        throw new Error(`Invalid JSON response from server. Raw: ${responseText}`);
      }

      if (!data || data.error !== false) {
        throw new Error(data?.error || "Unknown server error");
      }

      const restaurantId =
        data.result?.restaurantId || restaurantDetails.restaurantId;

      // Handle image upload if a new image was selected
      if (selectedImage) {
        try {
          const formData = new FormData();
          formData.append("file", selectedImage);
          formData.append("restaurantId", restaurantId.toString());
          formData.append("itemId", "0");

          const imageResponse = await fetch(`${API_URL}/api/upload/uploadImage`, {
            method: "POST",
            body: formData,
          });

          if (!imageResponse.ok) {
            throw new Error(
              `Image upload failed with status: ${imageResponse.status}`
            );
          }

          const imageData = await imageResponse.json();
          if (!imageData.success || !imageData.fileUrl) {
            throw new Error(imageData.error || "Upload failed");
          }

          imageUrl = imageData.fileUrl;

          if (isUpdate) {
            const updateImageResponse = await fetch(url, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ...body, image: imageUrl }),
            });

            if (!updateImageResponse.ok) {
              throw new Error("Failed to update restaurant with new image URL");
            }
          }
        } catch (error) {
          console.error("Image upload/update failed:", error);
          toast.error(
            isUpdate
              ? "Restaurant updated but image upload failed. You can update the image later."
              : "Restaurant created but image upload failed. You can update the image later."
          );
        }
      }

      setRestaurantDetails((prev) => ({
        ...prev,
        restaurantId,
        image: imageUrl,
        menuUploaded: false,
      }));

      setSelectedImage(null);
      toast.success(
        isUpdate
          ? "Restaurant updated successfully!"
          : "Restaurant created successfully!"
      );

      // Move to next step
      setTimeout(() => {
        setSetupStep(2);
      }, 100);
    } catch (error: any) {
      console.error("Error saving restaurant details:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Network error - please check your connection and try again");
      } else if (error.message.includes("empty response")) {
        toast.error("Server error - no response received. Please try again.");
      } else if (error.message.includes("Invalid JSON")) {
        toast.error("Server error - invalid response. Please contact support.");
      } else {
        toast.error(error.message || "Failed to save restaurant details");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Menu File Upload Handler ---
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
    <div className="p-6 lg:p-8 bg-white min-h-screen overflow-auto">
      <div className="max-w-3xl mx-auto bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {restaurantDetails.restaurantId
              ? "Update Restaurant"
              : "Restaurant Setup"}
          </h1>
          <button
            onClick={() => setShowSetup(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center w-full">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${
                setupStep >= 1
                  ? "bg-[#ff6b2c] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-[2px] mx-3 ${
                setupStep === 2 ? "bg-[#ff6b2c]" : "bg-gray-200"
              } transition-all`}
            />
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${
                setupStep === 2
                  ? "bg-[#ff6b2c] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Step 1: Restaurant Details */}
        {setupStep === 1 && (
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="max-w-4xl mx-auto">
              {/* Section Heading */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Restaurant Details
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Fill in the information about your restaurant
                </p>
              </div>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                      className={`pl-10 w-full rounded-md border ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c] transition-all bg-gray-50 focus:bg-white`}
                      placeholder="Enter your restaurant name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <span className="mr-1">•</span> {errors.name}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Description <span className="text-red-500">*</span>
                  </label>
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
                    className={`w-full rounded-md border ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c] transition-all bg-gray-50 focus:bg-white`}
                    placeholder="Brief description of your restaurant (5-8 words)"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <span className="mr-1">•</span> {errors.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div className="py-6 border-t border-gray-200 mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                  onFileSelect={(file) => setSelectedImage(file)}
                />
              </div>

              {/* Contact and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      required
                      value={restaurantDetails.contactNo}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        const formattedValue = inputValue.startsWith("+971")
                          ? inputValue
                          : "+971 " + inputValue.replace(/[^0-9]/g, "").slice(3);
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
                      className={`pl-10 w-full rounded-md border ${
                        errors.contactNo ? "border-red-500" : "border-gray-300"
                      } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c] transition-all bg-gray-50 focus:bg-white`}
                      placeholder="+971 5XXXXXXXX"
                    />
                  </div>
                  {errors.contactNo && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <span className="mr-1">•</span> {errors.contactNo}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={captureLocation}
                    className={`w-full px-4 py-2 text-sm font-medium rounded-md shadow-sm flex items-center justify-center space-x-2 transition-all ${
                      restaurantDetails.location
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-[#ff6b2c] hover:bg-[#e85a1f]"
                    } text-white`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>
                      {restaurantDetails.location
                        ? "Location Captured"
                        : "Get Location"}
                    </span>
                  </button>
                  {restaurantDetails.location && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Location has been captured.</span>
                    </div>
                  )}
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <span className="mr-1">•</span> {errors.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 text-gray-400 w-5 h-5" />
                  <textarea
                    required
                    value={restaurantDetails.address}
                    onChange={(e) =>
                      setRestaurantDetails((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className={`pl-10 w-full rounded-md border ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c] transition-all bg-gray-50 focus:bg-white`}
                    placeholder="Enter complete restaurant address"
                    rows={3}
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <span className="mr-1">•</span> {errors.address}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  className="inline-flex items-center px-5 py-2 rounded-md font-medium text-white bg-[#ff6b2c] hover:bg-[#e85a1f] transition-all shadow-md"
                >
                  <span>Save &amp; Continue</span>
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Upload Menu */}
        {setupStep === 2 && (
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
              <div className="text-red-500 text-sm mt-2">
                Please save restaurant details first to get a Restaurant ID
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 text-sm font-medium rounded-md bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 transition-all"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !restaurantDetails.restaurantId}
                className="ml-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-[#ff6b2c] hover:bg-[#e85a1f] disabled:opacity-50 transition-all shadow-sm"
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
