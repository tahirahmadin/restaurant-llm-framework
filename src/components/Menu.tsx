import React, { useState, useEffect, useCallback } from "react";
import MenuManagement from "./MenuManagement";
import { Settings } from "./Settings";
import { toast } from "sonner";
import useAuthStore from "../store/useAuthStore";
import { getRestaurantMenu, getRestaurantProfile } from "../actions/serverActions";

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

interface AddOnItem {
  name: string;
  price: number;
}

interface AddOnCategory {
  categoryName: string;
  minQuantity: number;
  maxQuantity: number;
  items: AddOnItem[];
}

interface ItemCustomisation {
  id: number;
  customisation: {
    categories: AddOnCategory[];
  };
}

interface RestaurantDetails {
  restaurantId: number;
  name: string;
  contactNo: string;
  address: string;
  location?: {
    type?: string;
    coordinates: [number, number];
  };
  menuUploaded?: boolean;
  menu?: {
    File?: File | null;
    extractedText?: string;
  };
}

export function Menu() {
  const { user } = useAuthStore();

  // Initialize restaurantDetails from localStorage or default
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails>(() => {
    const saved = localStorage.getItem("restaurantDetails");
    return saved
      ? JSON.parse(saved)
      : {
          restaurantId: user?.restaurantId,
          name: "",
          contactNo: "",
          address: "",
          menuUploaded: false,
          menu: { File: null, extractedText: "" },
        };
  });

  // Initialize menuItems state and loading indicator
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Update restaurantDetails.menuUploaded based on profile
  useEffect(() => {
    const checkMenuStatus = async () => {
      if (!user?.restaurantId) {
        toast.error("Restaurant ID not found");
        return;
      }
      try {
        const profile = await getRestaurantProfile(user.restaurantId);
        setRestaurantDetails((prev) => ({ ...prev, menuUploaded: profile.menuUploaded }));
      } catch (error) {
        console.error("Error fetching restaurant profile:", error);
      }
    };
    checkMenuStatus();
  }, [user?.restaurantId]);

  const fetchMenu = useCallback(async () => {
    if (!user?.restaurantId) {
      toast.error("Restaurant ID not found");
      return;
    }
    setIsLoading(true);
    try {
      const menu = await getRestaurantMenu(user.restaurantId);
      setMenuItems(menu);
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.restaurantId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleMenuData = (data: MenuItem[]) => {
    try {
      setMenuItems(data);
      toast.success("Menu data processed successfully!");
    } catch (error) {
      console.error("Error processing menu data:", error);
      toast.error("Failed to process menu data");
    }
  };

  const handleMenuUpdate = (
    updatedMenu: MenuItem[],
    updatedCustomisations: ItemCustomisation[]
  ) => {
    try {
      setMenuItems(updatedMenu);
      toast.success("Menu and customisations updated successfully!");
    } catch (error) {
      console.error("Error saving menu update:", error);
      toast.error("Failed to save menu changes");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading menu...</div>
      </div>
    );
  }

  // Instead of a separate state, we now check restaurantDetails.menuUploaded.
  if (!restaurantDetails.menuUploaded) {
    return (
      <Settings
        showSetup={true}
        setShowSetup={() => {}}
        setupStep={1}
        setSetupStep={() => {}}
        restaurantDetails={restaurantDetails}
        setRestaurantDetails={setRestaurantDetails}
        onMenuProcessed={handleMenuData}
      />
    );
  }

  return (
    <MenuManagement
      restaurantId={user?.restaurantId || 0}
      restaurantName={restaurantDetails.name}
      initialMenuData={menuItems}
      initialCustomisations={[]}
      onClose={() => {}}
      onUpdate={handleMenuUpdate}
    />
  );
}
