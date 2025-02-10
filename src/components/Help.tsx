import React, { useState, useEffect } from "react";
import MenuManagement from "./MenuManagement";
import { Toaster, toast } from "sonner";

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
  isOnline?: boolean;
  menuSummary: string;
  menuUploaded?: boolean;
  menu?: {
    File?: File | null;
    extractedText?: string;
  };
}

export function Help() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showMenuManagement, setShowMenuManagement] = useState(false);

  // Initialize menuItems from localStorage
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const savedMenu = localStorage.getItem("restaurantMenu");
    return savedMenu ? JSON.parse(savedMenu) : [];
  });

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
            menuSummary: "",
            isOnline: false,
            menuUploaded: false,
            menu: { File: null, extractedText: "" },
          };
    }
  );

  // **Merging customisations with menuItems**
  const getMergedCustomisations = () => {
    return menuItems.map((item) => {
      const found = customisations.find((c) => c.id === item.id);
      return {
        ...item,
        is_customized: !!found?.customisation.categories.length,
        customisation: found ? found.customisation : { categories: [] },
      };
    });
  };

  // **Updating localStorage in real-time**
  useEffect(() => {
    localStorage.setItem("restaurantMenu", JSON.stringify(menuItems));
    localStorage.setItem("customisations", JSON.stringify(customisations));
    localStorage.setItem(
      "restaurantDetails",
      JSON.stringify(restaurantDetails)
    );
    localStorage.setItem(
      "mergedCustomisations",
      JSON.stringify(getMergedCustomisations())
    );
  }, []);
  const handleRestaurantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSetup(false);
    toast.success("Restaurant setup saved successfully!");
  };

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

  return (
        <MenuManagement
          restaurantId={restaurantDetails.restaurantId}
          restaurantName={restaurantDetails.name}
          initialMenuData={menuItems}
          initialCustomisations={customisations}
          onClose={() => setShowMenuManagement(false)}
          onUpdate={handleMenuUpdate}
        />
  );
}
