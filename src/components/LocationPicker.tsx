import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  address: string;
  onAddressChange: (address: string, lat: number, lng: number) => void;
  className?: string;
}

export function LocationPicker({
  address,
  onAddressChange,
  className = "",
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"],
      });

      try {
        await loader.load();
        if (!mapRef.current) return;

        // Default to a central location
        const defaultLocation = { lat: 25.2048, lng: 55.2708 }; // Dubai coordinates

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 13,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        const markerInstance = new google.maps.Marker({
          map: mapInstance,
          position: defaultLocation,
          draggable: true,
          animation: google.maps.Animation.DROP,
        });

        // Initialize SearchBox
        if (searchBoxRef.current) {
          const searchBox = new google.maps.places.SearchBox(
            searchBoxRef.current
          );

          mapInstance.addListener("bounds_changed", () => {
            searchBox.setBounds(
              mapInstance.getBounds() as google.maps.LatLngBounds
            );
          });

          searchBox.addListener("places_changed", () => {
            const places = searchBox.getPlaces();
            if (!places || places.length === 0) return;

            const place = places[0];
            if (!place.geometry || !place.geometry.location) return;

            // Update map and marker
            mapInstance.setCenter(place.geometry.location);
            markerInstance.setPosition(place.geometry.location);

            // Update parent component
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            onAddressChange(place.formatted_address || "", lat, lng);
          });
        }

        // Handle marker drag end
        markerInstance.addListener("dragend", () => {
          const position = markerInstance.getPosition();
          if (!position) return;

          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              const lat = position.lat();
              const lng = position.lng();
              onAddressChange(results[0].formatted_address, lat, lng);
              if (searchBoxRef.current) {
                searchBoxRef.current.value = results[0].formatted_address;
              }
            }
          });
        });

        setMap(mapInstance);
        setMarker(markerInstance);
        setIsLoading(false);

        // If initial address is provided, geocode it
        if (address) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              const location = results[0].geometry.location;
              mapInstance.setCenter(location);
              markerInstance.setPosition(location);
            }
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={searchBoxRef}
          type="text"
          defaultValue={address}
          placeholder="Search for a location..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
        />
      </div>

      <div
        ref={mapRef}
        className={`w-full h-[300px] rounded-lg ${
          isLoading ? "animate-pulse bg-gray-200" : ""
        }`}
      />

      <p className="text-xs text-gray-500">
        Drag the marker or search for a location to set the exact address
      </p>
    </div>
  );
}
