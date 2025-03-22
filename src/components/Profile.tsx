import React, { useState, useEffect } from "react";
import { Camera, Check, MapPin, Phone, Building2, Mail } from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "../store/useAuthStore";
import {
  getRestaurantProfile,
  updateRestaurantProfile,
} from "../actions/serverActions";
import { API_URL } from "../config";

interface RestaurantProfile {
  _id: string;
  address: string;
  chainType: string;
  contactNumber: number;
  createdDate: string;
  description: string;
  email: string;
  image: string;
  lastUpdatedAt: string;
  menuId: string;
  paymentModes: {
    CRYPTO: boolean;
    STRIPE: boolean;
    UPI: boolean;
    COUNTER: boolean;
  };
  paymentsEnabled: boolean;
  restaurantIds: number[];
  restaurantName: string;
  role: string;
}

export function Profile() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<RestaurantProfile | null>(
    null
  );
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.adminId) {
        toast.error("Admin ID not found");
        return;
      }

      try {
        const data = await getRestaurantProfile(user.adminId);
        setProfileData(data);
        setCurrentImageUrl(data.image || "https://via.placeholder.com/150");
      } catch (error) {
        toast.error("Failed to load restaurant profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.adminId]);

  const fetchWithCache = async (imageUrl: string) => {
    try {
      const cache = await caches.open("image-cache");
      await cache.delete(imageUrl);
      const response = await fetch(imageUrl, { cache: "reload" });
      await cache.put(imageUrl, response.clone());
      return response;
    } catch (error) {
      console.error("Cache operation failed:", error);
      return fetch(imageUrl);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      toast.loading("Uploading image...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("restaurantId", user?.restaurantId?.toString() || "");
      formData.append("itemId", "0");

      const tempUrl = URL.createObjectURL(file);
      setCurrentImageUrl(tempUrl);
      setImageKey((prev) => prev + 1);

      const response = await fetch(`${API_URL}/upload/uploadImage`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Upload failed");

      // Force fetch new image and clear cache
      await fetchWithCache(data.fileUrl);

      const imageUrlWithTimestamp = `${data.fileUrl}?t=${Date.now()}`;
      setCurrentImageUrl(imageUrlWithTimestamp);
      setProfileData((prev) =>
        prev ? { ...prev, image: imageUrlWithTimestamp } : null
      );
      setImageKey((prev) => prev + 1);

      URL.revokeObjectURL(tempUrl);
      toast.dismiss();
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.dismiss();
      toast.error("Failed to upload image");
      setCurrentImageUrl(profileData?.image || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData || !user?.restaurantId) return;
    const { username } = user;

    try {
      const updatedProfile = await updateRestaurantProfile(user.restaurantId, {
        name: profileData.name,
        description: profileData.description,
        contactNo: profileData.contactNo,
        address: profileData.address,
        adminUsername: username,
        image: profileData.image,
        location: {
          longitude: profileData.location.coordinates[0],
          latitude: profileData.location.coordinates[1],
        },
      });

      setProfileData(updatedProfile);
      setCurrentImageUrl(updatedProfile.image || "");
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-red-500">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Restaurant Profile
          </h1>
          <p className="text-sm text-gray-500">Restaurant basic information</p>
        </div>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-600 text-white hover:bg-red-700"
          >
            {isEditing ? "Cancel Editing" : "Edit Profile"}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 mt-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-6">
            <div className="relative w-full">
              <div className="flex justify-center items-center w-full rounded-xl h-[200px]">
                <img
                  key={imageKey}
                  src={`${
                    currentImageUrl || "https://via.placeholder.com/150"
                  }?v=${imageKey}`}
                  alt="Restaurant Profile"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/150";
                    console.error("Image load error");
                  }}
                  onLoad={() => console.log("Image loaded successfully")}
                />
              </div>
              {isEditing && (
                <label className="absolute bottom-2 right-2 w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="flex justify-between">
            <p className="text-gray-600">
              Restaurant ID: {profileData.restaurantId}
            </p>
            <p className="text-gray-600">
              Partner since:{" "}
              {new Date(profileData.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={profileData.restaurantName}
                  onChange={(e) =>
                    setProfileData((prev) =>
                      prev ? { ...prev, restaurantName: e.target.value } : null
                    )
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={profileData.contactNumber}
                  onChange={(e) =>
                    setProfileData((prev) =>
                      prev
                        ? {
                            ...prev,
                            contactNumber: parseInt(e.target.value) || 0,
                          }
                        : null
                    )
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={profileData.description}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                rows={2}
                disabled={!isEditing}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData((prev) =>
                      prev ? { ...prev, address: e.target.value } : null
                    )
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Additional Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Chain Type</p>
                <p className="font-medium">{profileData.chainType}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium">{profileData.role}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{profileData.email}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Payments Enabled</p>
                <p className="font-medium">
                  {profileData.paymentsEnabled ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
