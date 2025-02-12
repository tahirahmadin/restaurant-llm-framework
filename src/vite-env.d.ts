/// <reference types="vite/client" />

interface Window {
  google: typeof google;
}

declare namespace google.maps {
  class Geocoder {
    geocode(
      request: {
        address?: string;
        location?: { lat: number; lng: number };
      },
      callback: (
        results: google.maps.GeocoderResult[] | null,
        status: string
      ) => void
    ): void;
  }

  interface GeocoderResult {
    formatted_address: string;
    geometry: {
      location: {
        lat(): number;
        lng(): number;
      };
    };
  }
}