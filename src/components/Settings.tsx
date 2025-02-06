import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy } from 'lucide-react';
import { Building2, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import MyDropzone from './MyDropzone';
import { API_URL } from '../config';

interface FileState {
  File: File | null;
  extractedText?: string;
}

interface RestaurantDetails {
  restaurantId?: number; 
  name: string;
  contactNo: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isOnline?: boolean;
  /** Short summary or description of the menu items **/
  menuSummary: string;
  // For file uploads (optional)
  menu?: {
    File?: File | null;
    extractedText?: string;
  };
}

interface MenuItem {
  [key: string]: any;
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
  const [isIdVisible, setIsIdVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // COMMENTED OUT to avoid resetting the ID every time:
  /*
  useEffect(() => {
    if (!restaurantDetails || !restaurantDetails.restaurantId) {
      console.log('Resetting restaurantDetails state'); // 🔍 Debugging step
      setRestaurantDetails({
        name: '',
        contactNo: '',
        address: '',
        location: null,
        menuSummary: '',
      });
    }
  }, []);
  */

  /** -----------------------------
   *  Validation
   * -----------------------------**/
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!restaurantDetails.name?.trim()) {
          newErrors.name = 'Restaurant name is required';
        }
        if (!restaurantDetails.contactNo?.trim()) {
          newErrors.contactNo = 'Contact number is required';
        } else if (!/^\d{10}$/.test(restaurantDetails.contactNo)) {
          newErrors.contactNo = 'Enter a valid 10-digit contact number';
        }
        if (!restaurantDetails.address?.trim()) {
          newErrors.address = 'Address is required';
        }
        if (!restaurantDetails.menuSummary?.trim()) {
          newErrors.menuSummary = 'Please provide a summary of your menu items';
        }
        if (!restaurantDetails.location) {
          newErrors.location = 'Please capture your location';
        }
        break;

      case 2:
        if (!restaurantDetails.menu?.File) {
          newErrors.menu = 'Please upload your menu';
        }
        break;
      // Step 3 could have additional validations or final checks if needed
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** -----------------------------
   *  Step Navigation
   * -----------------------------**/
  const handleNextStep = () => {
    if (validateStep(setupStep)) {
      setSetupStep((prev) => prev + 1);
    } else {
      toast.error('Please fill all required fields correctly');
    }
  };

  const handlePrevStep = () => {
    setSetupStep((prev) => prev - 1);
    setErrors({});
  };

  /** -----------------------------
   *  Capture Geolocation
   * -----------------------------**/
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
          toast.success('Location captured successfully');
          setErrors((prev) => ({ ...prev, location: '' }));
        },
        (error) => {
          console.error('Error:', error);
          toast.error('Please enable location services');
          setErrors((prev) => ({
            ...prev,
            location: 'Failed to capture location',
          }));
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  /** -----------------------------
   *  (Optional) handleRestaurantSubmit - if you had a final submit
   *  (Currently not used, but we keep it to not lose code)
   * -----------------------------**/
  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Final validation before submit
    if (!validateStep(3)) {
      toast.error('Please review all details');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/restaurantDetails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: restaurantDetails.name,
          contactNo: restaurantDetails.contactNo,
          address: restaurantDetails.address,
          location: restaurantDetails.location,
          isOnline: restaurantDetails.isOnline,
          menuSummary: restaurantDetails.menuSummary,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save restaurant details');

      setRestaurantDetails((prev) => ({
        ...prev,
        // Not sure how you want to store the ID
        // id: data.restaurants[data.restaurants.length - 1].id,
      }));

      toast.success('Restaurant saved successfully!');
      setShowSetup(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to save restaurant details');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** -----------------------------
   *  CREATE or UPDATE Restaurant
   * -----------------------------**/
   const handleSaveDetails = async () => {
    if (validateStep(1)) {
      try {
        console.log('Restaurant details before saving:', restaurantDetails);
  
        const body = {
          name: restaurantDetails.name,
          contactNo: restaurantDetails.contactNo,
          address: restaurantDetails.address,
          location: restaurantDetails.location,
          menuSummary: restaurantDetails.menuSummary,
          isOnline: restaurantDetails.isOnline ?? false,
        };
  
        let url = `${API_URL}/api/restaurant/createRestaurant`;  // Default to create API
        let method = "POST";  // Default method
  
        if (restaurantDetails.restaurantId) {
          url = `${API_URL}/api/restaurant/updateRestaurant/${restaurantDetails.restaurantId}`;
          method = "PUT";  // Use PUT for updates
        }
  
        console.log(`Sending ${method} request to:`, url, 'with body:', JSON.stringify(body));
  
        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
  
        const data = await response.json();
        console.log('Server Response:', data);
  
        if (!data.success) {
          throw new Error(data.error || 'Failed to save restaurant');
        }
  
        // Update local state with response data
        if (data.success && data.data) {
          setRestaurantDetails((prev) => ({
            ...prev,
            restaurantId: data.data.restaurantId,  // Store ID to switch to update mode
            menuUploaded: data.data.menuUploaded,
          }));
        }
  
        toast.success('Restaurant saved successfully!');
      } catch (error: any) {
        console.error('Error saving restaurant details:', error);
        toast.error(error.message || 'Failed to save restaurant details');
      }
    } else {
      toast.error('Please fill all required fields correctly');
    }
  };

  /** -----------------------------
   *  File Upload (Menu)
   * -----------------------------**/
   const setFileUpload = ({ File, extractedText }: FileState) => {
    if (!restaurantDetails.restaurantId) {
      toast.error("Please complete restaurant registration first");
      return;
    }
  
    // Store the uploaded file reference, but DO NOT send a request yet
    setRestaurantDetails((prev) => ({
      ...prev,
      menu: { File, extractedText },
    }));
  
    toast.success("Menu file uploaded. Processing will begin...");
  };

  /** Hide if not showSetup */
  if (!showSetup) return null;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {restaurantDetails.restaurantId ? 'Update Restaurant' : 'Restaurant Setup'}
          </h1>
          <button onClick={() => setShowSetup(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center w-full">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                setupStep >= 1 ? 'bg-[#ff6b2c] text-white' : 'bg-gray-200'
              }`}
            >
              1
            </div>
            <div className={`flex-1 h-1 mx-4 ${setupStep === 2 ? 'bg-[#ff6b2c]' : 'bg-gray-200'}`} />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                setupStep === 2 ? 'bg-[#ff6b2c] text-white' : 'bg-gray-200'
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* STEP 1 */}
        {setupStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Restaurant Details</h2>
            <div className="space-y-4">
              {/* Restaurant Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
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
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]`}
                    placeholder="Enter restaurant name"
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    required
                    value={restaurantDetails.contactNo}
                    onChange={(e) =>
                      setRestaurantDetails((prev) => ({
                        ...prev,
                        contactNo: e.target.value,
                      }))
                    }
                    className={`pl-10 w-full rounded-lg border ${
                      errors.contactNo ? 'border-red-500' : 'border-gray-300'
                    } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]`}
                    placeholder="Enter 10-digit contact number"
                  />
                </div>
                {errors.contactNo && <p className="mt-1 text-sm text-red-500">{errors.contactNo}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
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
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]`}
                    placeholder="Enter restaurant address"
                    rows={3}
                  />
                </div>
                {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
              </div>

              {/* Menu Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary of Menu Items *
                </label>
                <div className="relative">
                  <textarea
                    required
                    value={restaurantDetails.menuSummary || ''}
                    onChange={(e) =>
                      setRestaurantDetails((prev) => ({
                        ...prev,
                        menuSummary: e.target.value,
                      }))
                    }
                    className={`pl-3 w-full rounded-lg border ${
                      errors.menuSummary ? 'border-red-500' : 'border-gray-300'
                    } px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]`}
                    placeholder="Briefly describe your menu..."
                    rows={3}
                  />
                </div>
                {errors.menuSummary && <p className="mt-1 text-sm text-red-500">{errors.menuSummary}</p>}
              </div>

              {/* Location */}
              <div>
                <button
                  type="button"
                  onClick={captureLocation}
                  className={`w-full px-4 py-2 ${
                    restaurantDetails.location ? 'bg-green-600' : 'bg-[#ff6b2c]'
                  } text-white rounded-lg hover:opacity-90`}
                >
                  {restaurantDetails.location ? '📍 Location Captured' : '📍 Get Location'}
                </button>
                {restaurantDetails.location && (
                  <p className="mt-2 text-sm text-gray-600">
                    Location: {restaurantDetails.location.latitude?.toFixed(6) || 'N/A'},{' '}
                    {restaurantDetails.location.longitude?.toFixed(6) || 'N/A'}
                  </p>
                )}
                {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
              </div>
            </div>
            <div className="flex justify-between mt-6 space-x-4">
              <button
                type="button"
                onClick={handleSaveDetails}
                className="ml-auto px-4 py-2 bg-[#ff6b2c] text-white rounded-lg hover:bg-[#e85a1f]"
              >
                Save
              </button>
              {/* Next Button */}
              <button
                type="button"
                onClick={handleNextStep} // Move to Step 2
                className="px-4 py-2 bg-[#ff6b2c] text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {setupStep === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Menu</h2>
            {restaurantDetails.restaurantId ? (
              <MyDropzone
                FileUpload={{
                  File: restaurantDetails.menu?.File || null,
                  extractedText: restaurantDetails.menu?.extractedText || '',
                }}
                setFileUpload={setFileUpload}
                onMenuProcessed={onMenuProcessed}
                restaurantId={restaurantDetails.restaurantId}  // Add this line
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
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
