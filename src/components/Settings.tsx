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
            <div className="flex justify-center mt-6">
            
              <button
                type="submit"
                disabled={isSubmitting || !restaurantDetails.restaurantId}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all shadow-sm"
                onClick={() => setShowSetup(false)}
              >
                {isSubmitting ? "Submitting..." : "Submit menu"}
              </button>
            </div>
          </div>
      

      
      </div>
    </div>
  );
}