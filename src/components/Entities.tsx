import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Plus,
  Trash2,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "../store/useAuthStore";
import { LocationPicker } from "./LocationPicker";
import type { LocationDetails } from "../types/location";
import {
  addRestaurantsToChain,
  getChainLocations,
} from "../actions/serverActions";
import { getAddressFromCoordinates } from "../utils/maps";

export function Entities() {
  const { user, adminId } = useAuthStore();
  const [locations, setLocations] = useState<LocationDetails[]>([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<LocationDetails>({
    name: "",
    contactNo: "",
    address: "",
    location: {
      longitude: 0,
      latitude: 0,
    },
    manager: {
      email: "",
      password: "",
    },
  });
  const [editingLocation, setEditingLocation] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState<number | null>(null);
  const [editedLocation, setEditedLocation] = useState<LocationDetails | null>(
    null
  );

  useEffect(() => {
    if (adminId) {
      loadLocations();
    }
  }, [adminId]);

  const loadLocations = async () => {
    if (!adminId) {
      toast.error("Admin ID not found");
      return;
    }

    try {
      const fetchedLocations = await getChainLocations(adminId);
      setLocations(fetchedLocations);
    } catch (error) {
      toast.error("Failed to load locations");
    }
  };

  const handleAddressChange = (
    address: string,
    lat: number,
    lng: number,
    isNew: boolean = false
  ) => {
    const locationData = {
      address,
      location: {
        latitude: lat,
        longitude: lng,
      },
    };

    if (isNew) {
      setNewLocation((prev) => ({
        ...prev,
        ...locationData,
      }));
    } else if (editedLocation) {
      setEditedLocation((prev) => ({
        ...prev!,
        ...locationData,
      }));
    }
  };

  const handleEdit = (location: LocationDetails, index: number) => {
    setEditingLocation(index);
    setEditedLocation(location);
  };

  const handleSaveEdit = async (index: number) => {
    if (!editedLocation) return;

    try {
      // Add API call here to update location
      const newLocations = [...locations];
      newLocations[index] = editedLocation;
      setLocations(newLocations);
      setEditingLocation(null);
      setEditedLocation(null);
      toast.success("Location updated successfully");
    } catch (error) {
      toast.error("Failed to update location");
    }
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditedLocation(null);
  };

  const captureLocation = async () => {
    if (navigator.geolocation) {
      setIsCapturingLocation(true);
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          }
        );
        const address = await getAddressFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
        setNewLocation((prev) => ({
          ...prev,
          address,
          location: {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
          },
        }));
        toast.success("Location captured successfully");
      } catch (error) {
        toast.error("Failed to capture location");
      } finally {
        setIsCapturingLocation(false);
      }
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleAddLocation = async () => {
    if (
      !newLocation.name ||
      !newLocation.address ||
      !newLocation.location ||
      !newLocation.manager?.email ||
      !newLocation.manager?.password
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!adminId) {
      toast.error("Admin Id not found");
      return;
    }

    try {
      await addRestaurantsToChain([newLocation], adminId);
      await loadLocations();
      setIsAddingLocation(false);
      setNewLocation({
        name: "",
        contactNo: "",
        address: "",
        location: {
          longitude: 0,
          latitude: 0,
        },

        manager: {
          email: "",
          password: "",
        },
      });
      toast.success("Location added successfully");
    } catch (error) {
      toast.error("Failed to add location");
    }
  };

  const handleRemoveLocation = async (index: number) => {
    try {
      // Add API call here to remove location
      const newLocations = [...locations];
      newLocations.splice(index, 1);
      setLocations(newLocations);
      toast.success("Location removed successfully");
    } catch (error) {
      toast.error("Failed to remove location");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Restaurant Entities
          </h1>
          <p className="text-sm text-gray-500">
            Manage your restaurant locations
          </p>
        </div>
        <button
          onClick={() => setIsAddingLocation(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {locations.map((location, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all relative"
          >
            {editingLocation === index ? (
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleSaveEdit(index)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleEdit(location, index)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveLocation(index)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                {editingLocation === index ? (
                  <input
                    type="text"
                    value={editedLocation?.name}
                    onChange={(e) =>
                      setEditedLocation((prev) => ({
                        ...prev!,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                ) : (
                  <h3 className="font-medium text-gray-900">{location.name}</h3>
                )}
              </div>
            </div>

            <div className="mb-4">
              {editingLocation === index ? (
                <LocationPicker
                  address={editedLocation?.address || ""}
                  onAddressChange={(address, lat, lng) =>
                    handleAddressChange(address, lat, lng, false)
                  }
                />
              ) : (
                <p className="text-sm text-gray-500 flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 shrink-0" />
                  {location.address}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {editingLocation === index ? (
                  <input
                    type="tel"
                    value={editedLocation?.contactNo}
                    onChange={(e) =>
                      setEditedLocation((prev) => ({
                        ...prev!,
                        contactNo: e.target.value,
                      }))
                    }
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                ) : (
                  <span className="text-sm text-gray-600">
                    {location.contactNo}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {editingLocation === index ? (
                  <input
                    type="email"
                    value={editedLocation?.manager?.email}
                    onChange={(e) =>
                      setEditedLocation((prev) => ({
                        ...prev!,
                        manager: { ...prev!.manager!, email: e.target.value },
                      }))
                    }
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                ) : (
                  <span className="text-sm text-gray-600">
                    {location.manager?.email}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                {editingLocation === index ? (
                  <input
                    type="password"
                    value={editedLocation?.manager?.password}
                    onChange={(e) =>
                      setEditedLocation((prev) => ({
                        ...prev!,
                        manager: {
                          ...prev!.manager!,
                          password: e.target.value,
                        },
                      }))
                    }
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {showPassword === index
                        ? location.manager?.password
                        : "••••••••"}
                    </span>
                    <button
                      onClick={() =>
                        setShowPassword(showPassword === index ? null : index)
                      }
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword === index ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Location Modal */}
      {isAddingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] max-w-lg mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Add New Location
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="Enter location name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={newLocation.contactNo}
                    onChange={(e) =>
                      setNewLocation({
                        ...newLocation,
                        contactNo: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="Enter contact number"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <LocationPicker
                  address={newLocation.address}
                  onAddressChange={(address, lat, lng) =>
                    handleAddressChange(address, lat, lng, true)
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Location Manager
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={newLocation.manager?.email}
                        onChange={(e) =>
                          setNewLocation({
                            ...newLocation,
                            manager: {
                              ...newLocation.manager!,
                              email: e.target.value,
                            },
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                        placeholder="Enter manager's email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        value={newLocation.manager?.password}
                        onChange={(e) =>
                          setNewLocation({
                            ...newLocation,
                            manager: {
                              ...newLocation.manager!,
                              password: e.target.value,
                            },
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                        placeholder="Create manager password"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsAddingLocation(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLocation}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
