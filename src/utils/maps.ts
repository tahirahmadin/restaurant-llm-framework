// Utility functions for Google Maps integration
let googleMapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
  if (googleMapsLoaded) {
    return Promise.resolve();
  }

  // Return existing promise if script is currently loading
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    // Check if script is already in the document
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsLoaded = true;
      loadingPromise = null;
      resolve();
    };

    script.onerror = (error) => {
      loadingPromise = null;
      reject(new Error('Failed to load Google Maps script: ' + error));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    await loadGoogleMapsScript();
    
    return new Promise((resolve, reject) => {
      if (!window.google?.maps) {
        reject(new Error('Google Maps is not loaded'));
        return;
      }

      const geocoder = new google.maps.Geocoder();
      const latlng = { lat: latitude, lng: longitude };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Geocoding failed with status: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Error in getAddressFromCoordinates:', error);
    throw new Error('Failed to get address from coordinates');
  }
};