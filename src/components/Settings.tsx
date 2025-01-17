import React from 'react';
import { Building2, Phone, MapPin, Upload } from 'lucide-react';

interface RestaurantDetails {
  name: string;
  contactNo: string;
  address: string;
  menu: File | null;
}

interface SettingsProps {
  showSetup: boolean;
  setShowSetup: (show: boolean) => void;
  setupStep: number;
  setSetupStep: (step: number) => void;
  restaurantDetails: RestaurantDetails;
  setRestaurantDetails: (details: RestaurantDetails) => void;
  handleRestaurantSubmit: (e: React.FormEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Settings({
  showSetup,
  setShowSetup,
  setupStep,
  setSetupStep,
  restaurantDetails,
  setRestaurantDetails,
  handleRestaurantSubmit,
  handleFileChange
}: SettingsProps) {
  if (!showSetup) return null;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Restaurant Setup</h1>
          <button
            onClick={() => setShowSetup(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center w-full">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${setupStep >= 1 ? 'bg-[#ff6b2c] text-white' : 'bg-gray-200'}`}>1</div>
            <div className={`flex-1 h-1 mx-4 ${setupStep >= 2 ? 'bg-[#ff6b2c]' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${setupStep >= 2 ? 'bg-[#ff6b2c] text-white' : 'bg-gray-200'}`}>2</div>
            <div className={`flex-1 h-1 mx-4 ${setupStep >= 3 ? 'bg-[#ff6b2c]' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${setupStep >= 3 ? 'bg-[#ff6b2c] text-white' : 'bg-gray-200'}`}>3</div>
          </div>
        </div>

        <form onSubmit={handleRestaurantSubmit} className="space-y-6">
          {setupStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Restaurant Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={restaurantDetails.name}
                      onChange={(e) => setRestaurantDetails(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]"
                      placeholder="Enter restaurant name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      required
                      value={restaurantDetails.contactNo}
                      onChange={(e) => setRestaurantDetails(prev => ({ ...prev, contactNo: e.target.value }))}
                      className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]"
                      placeholder="Enter contact number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      required
                      value={restaurantDetails.address}
                      onChange={(e) => setRestaurantDetails(prev => ({ ...prev, address: e.target.value }))}
                      className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff6b2c]"
                      placeholder="Enter restaurant address"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {setupStep === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Menu</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-[#ff6b2c]">Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.xlsx"
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">PDF, DOC, DOCX or XLSX up to 10MB</p>
                  </div>
                  {restaurantDetails.menu && (
                    <div className="mt-4 text-center text-sm text-gray-600">
                      Selected file: {restaurantDetails.menu.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {setupStep === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Review Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Restaurant Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{restaurantDetails.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Contact Number</h3>
                  <p className="mt-1 text-sm text-gray-900">{restaurantDetails.contactNo}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Address</h3>
                  <p className="mt-1 text-sm text-gray-900">{restaurantDetails.address}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Menu File</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {restaurantDetails.menu ? restaurantDetails.menu.name : 'No file uploaded'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {setupStep > 1 && (
              <button
                type="button"
                onClick={() => setSetupStep(prev => prev - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                Previous
              </button>
            )}
            {setupStep < 3 ? (
              <button
                type="button"
                onClick={() => setSetupStep(prev => prev + 1)}
                className="ml-auto px-4 py-2 bg-[#ff6b2c] text-white rounded-lg hover:bg-[#e85a1f]"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-[#ff6b2c] text-white rounded-lg hover:bg-[#e85a1f]"
              >
                Submit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}