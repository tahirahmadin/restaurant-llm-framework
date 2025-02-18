import React, { useState } from 'react';
import { Building2, Phone, MapPin, ImageIcon, User, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../../store/useAuthStore';
import { createRestaurant } from '../../actions/serverActions';
import { getAddressFromCoordinates, loadGoogleMapsScript } from '../../utils/maps';
import { API_URL } from '../../config';
import type { SignupData, RestaurantDetails } from '../../types/auth';
import { authenticateAdmin } from '../../actions/serverActions';

const steps = [
  { title: 'Restaurant Info', description: 'Basic restaurant details' },
  { title: 'Location', description: 'Address and location' },
  { title: 'Account', description: 'Create your account' }
];

export function Signup() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveTab = useAuthStore((state) => state.setActiveTab);
  
  // Restaurant Details
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails>({
    name: '',
    description: '',
    image: '',
    contactNo: '',
    address: '',
    location: undefined,
  });

  // Auth Details
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = password === confirmPassword;
  const showPasswordError = password && confirmPassword && !passwordsMatch;

  const captureLocation = async () => {
    if (navigator.geolocation) {
      setIsCapturingLocation(true);
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        // Get address from coordinates
        const address = await getAddressFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );

        // Update both location and address
        setRestaurantDetails(prev => ({
          ...prev,
          address,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        }));

        toast.success('Location and address captured successfully');
      } catch (error) {
        console.error('Error:', error);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to capture location');
        }
      } finally {
        setIsCapturingLocation(false);
      }
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setRestaurantDetails(prev => ({ ...prev, address }));
    
    if (!address.trim()) return;

    try {
      await loadGoogleMapsScript();
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          setRestaurantDetails(prev => ({
            ...prev,
            location: {
              latitude: location.lat(),
              longitude: location.lng(),
            }
          }));
        } else {
          console.warn('Geocoding failed:', status);
        }
      }, (error) => {
        console.error('Geocoding error:', error);
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/upload/uploadImage`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');

      setRestaurantDetails(prev => ({
        ...prev,
        image: data.fileUrl
      }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!restaurantDetails.name || !restaurantDetails.contactNo || !restaurantDetails.address) {
        toast.error('Please fill in all required fields');
        return;
      }
      setStep(2);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setUsernameError('');

    try {

      const response = await createRestaurant({
        username,
        password,
        restaurantDetails,
      });

      console.log('Response:', response);

      if (response.error) {
        setUsernameError('User with this name already exists');
        setIsLoading(false);
        return;
      }

      console.log('Proceeding to authentication...');

      const authResult = await authenticateAdmin({
        username,
        password
      });

      setUser({
        id: authResult.userId,
        username: authResult.username,
        restaurantId: authResult.restaurantId,
      });
      toast.success('Restaurant created successfully!');
      setActiveTab('menu');
    } catch (error) {
      toast.error('Failed to create restaurant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step > i + 1 
                  ? 'bg-green-500 text-white' 
                  : step === i + 1
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step > i + 1 ? <CheckCircle2 className="w-6 h-6" /> : i + 1}
              </div>
              <div className="text-center mt-2">
                <div className="text-sm font-medium">{s.title}</div>
                <div className="text-xs text-gray-500">{s.description}</div>
              </div>
            </div>
          ))}
          {/* Progress Line */}
          <div className="absolute top-5 left-0 h-[2px] bg-gray-200 w-full -z-10" />
          <div 
            className="absolute top-5 left-0 h-[2px] bg-red-600 transition-all duration-300 -z-10"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
      {step === 1 ? (
        <>
          {/* Step 1: Restaurant Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={restaurantDetails.name}
                onChange={(e) => setRestaurantDetails(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="Enter restaurant name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={restaurantDetails.description}
              onChange={(e) => setRestaurantDetails(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="Brief description of your restaurant"
              rows={3}
            />
          </div>
        </>
      ) : step === 2 ? (
        <>
          {/* Step 2: Location Details */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={restaurantDetails.address}
                onChange={handleAddressChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="Enter restaurant address"
              />
            </div>
          </div>
           {/* Location capture button  */}
          <button
            type="button"
            onClick={captureLocation}
            disabled={isCapturingLocation}
            className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              restaurantDetails.location
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
              }${isCapturingLocation ? ' opacity-75 cursor-not-allowed' : ''}`}
          >
            {isCapturingLocation ? (
              <>
                <svg 
                  className="animate-spin w-4 h-4" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Capturing...</span>
              </>
            ) : restaurantDetails.location ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Location Captured</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>Capture Location</span>
              </>
            )}
          </button>
        </>
      ) : (
        <>
          {/* Account Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError('');
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="Choose a username"
              />
            </div>
            {usernameError && (
              <p className="mt-1 text-sm text-red-500">
                {usernameError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="Choose a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {showPasswordError && (
              <p className="mt-1 text-sm text-red-500">
                Passwords do not match
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(prev => prev - 1)}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          type={step === 3 ? 'submit' : 'button'}
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          onClick={() => {
            if (step < 3) {
              setStep(prev => prev + 1);
            }
          }}
        >
          {isLoading ? 'Creating Account...' : step === 3 ? 'Create Account' : 'Next'}
        </button>
      </div>
    </form>
  );
}