import React, { useState, useEffect, useCallback } from "react";
import MenuManagement from "./MenuManagement";
import { Settings } from "./Settings";
import { Toaster, toast } from "sonner";
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
  const [showSetup, setShowSetup] = useState(true);
  const [setupStep, setSetupStep] = useState(1);
  const [menuUploaded, setMenuUploaded] = useState(false);
  const { user } = useAuthStore();

  // Initialize menuItems state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch restaurant profile to check menuUploaded status
  useEffect(() => {
    const checkMenuStatus = async () => {
      if (!user?.restaurantId) {
        toast.error("Restaurant ID not found");
        return;
      }

      try {
        const profile = await getRestaurantProfile(user.restaurantId);
        setMenuUploaded(profile.menuUploaded);
      } catch (error) {
        console.error("Error fetching restaurant profile:", error);
      }
    };

    checkMenuStatus();
  }, [user?.restaurantId]);

  // Initialize customisations from localStorage
  const [customisations, setCustomisations] = useState<ItemCustomisation[]>(
    () => {
      const savedCustomisations = localStorage.getItem("customisations");
      return savedCustomisations ? JSON.parse(savedCustomisations) : [];
    }
  );

  // Initialize restaurantDetails from localStorage
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails>(
    () => {
      const savedDetails = localStorage.getItem("restaurantDetails");
      return savedDetails
        ? JSON.parse(savedDetails)
        : {
            name: "",
            contactNo: "",
            address: "",
            menuUploaded: false,
            menu: { File: null, extractedText: "" },
          };
    }
  );

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

  // Fetch menu on component mount
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
      setCustomisations(updatedCustomisations);
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

  // If menu is not uploaded, show the upload interface
  if (!menuUploaded) {
    return (
      <Settings
        showSetup={true}
        setShowSetup={setShowSetup}
        setupStep={setupStep}
        setSetupStep={setSetupStep}
        restaurantDetails={restaurantDetails}
        setRestaurantDetails={setRestaurantDetails}
        onMenuProcessed={handleMenuData}
      />
    );
  }

  // If menu items exist, show the menu management interface
  return (
    <MenuManagement
      restaurantId={user?.restaurantId || 0}
      restaurantName={restaurantDetails.name}
      initialMenuData={menuItems}
      initialCustomisations={customisations}
      onClose={() => {}}
      onUpdate={handleMenuUpdate}
    />
  );
}