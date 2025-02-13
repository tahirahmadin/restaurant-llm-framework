import React, { useState, useEffect } from "react";
import { Camera, Check, MapPin, Phone, Building2, Mail } from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "../store/useAuthStore";
import { getRestaurantProfile, updateRestaurantProfile } from "../actions/serverActions";
import type { RestaurantProfile } from "../types/restaurant";
import { API_URL } from "../config";

export function Profile() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<RestaurantProfile | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.restaurantId) {
        toast.error("Restaurant ID not found");
        return;
      }

      try {
        const data = await getRestaurantProfile(user.restaurantId);
        setProfileData(data);
      } catch (error) {
        toast.error("Failed to load restaurant profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.restaurantId]);

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("restaurantId", user?.restaurantId?.toString() || "");
      formData.append("itemId", "0");

      const response = await fetch(`${API_URL}/api/upload/uploadImage`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Upload failed");

      setProfileData(prev => prev ? { ...prev, image: data.fileUrl } : null);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image");
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
        image:profileData.image,
        location: {
          latitude: profileData.location.coordinates[1],
          longitude: profileData.location.coordinates[0]
        }
      });

      setProfileData(updatedProfile);
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Restaurant Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-600 text-white hover:bg-red-700"
          >
            {isEditing ? "Cancel Editing" : "Edit Profile"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={profileData.image || "https://via.placeholder.com/150"}
                alt="Restaurant"
                className="w-32 h-32 rounded-xl object-cover"
              />
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
            <div>
              <h2 className="text-xl font-semibold">{profileData.name}</h2>
              <p className="text-gray-500 mt-1">Restaurant ID: {profileData.restaurantId}</p>
              <p className="text-gray-500 mt-1">
                Member since {new Date(profileData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={profileData.contactNo}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, contactNo: e.target.value } : null)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={profileData.description}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                rows={3}
                disabled={!isEditing}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, address: e.target.value } : null)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                  disabled={!isEditing}
                />
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