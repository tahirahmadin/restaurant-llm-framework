import React, { useState, useEffect } from "react";
import MenuManagement from "./MenuManagement";
import { Settings } from "./Settings";
import { toast } from "sonner";
import useAuthStore from "../store/useAuthStore";
import useRestaurantStore from "../store/useRestaurantStore";
import useMenuStore from "../store/useMenuStore";

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

export function Menu() {
  const { user } = useAuthStore();
  const { profile, isLoading: isLoadingProfile } = useRestaurantStore();
  const {
    items: menuItems,
    isLoading: isLoadingMenu,
    loadMenu,
  } = useMenuStore();
  const [customisations, setCustomisations] = useState<ItemCustomisation[]>([]);

  useEffect(() => {
    if (user?.email) {
      loadMenu(user.email);
    }
  }, [user?.email, loadMenu]);

  useEffect(() => {
    if (menuItems.length > 0) {
      const customisations = menuItems
        .filter((item) => item.isCustomisable)
        .map((item) => ({
          id: item.id,
          customisation: item.customisation,
        }));
      setCustomisations(customisations);
    }
  }, [menuItems]);

  const handleMenuData = (data: MenuItem[]) => {
    try {
      useMenuStore.getState().setItems(data);
      useRestaurantStore.getState().setProfile({
        ...profile!,
        menuUploaded: true,
      });
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
      useMenuStore.getState().setItems(updatedMenu);
      setCustomisations(updatedCustomisations);
      toast.success("Menu and customisations updated successfully!");
    } catch (error) {
      console.error("Error saving menu update:", error);
      toast.error("Failed to save menu changes");
    }
  };

  if (isLoadingMenu || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading menu...</div>
      </div>
    );
  }

  if (!profile?.menuUploaded) {
    return (
      <Settings
        showSetup={true}
        setShowSetup={() => {}}
        setupStep={1}
        setSetupStep={() => {}}
        restaurantDetails={{
          restaurantId: user?.restaurantId,
          name: profile?.name || "",
          description: profile?.description || "",
          image: profile?.image || "",
          contactNo: profile?.contactNo || "",
          address: profile?.address || "",
          menuUploaded: profile?.menuUploaded || false,
        }}
        setRestaurantDetails={(details) => {
          if (profile) {
            useRestaurantStore.getState().setProfile({
              ...profile,
              ...details,
            });
          }
        }}
        onMenuProcessed={handleMenuData}
      />
    );
  }

  return (
    <MenuManagement
      restaurantId={user?.restaurantId || 0}
      restaurantName={profile?.name || ""}
      initialMenuData={menuItems}
      initialCustomisations={customisations}
      onClose={() => {}}
      onUpdate={handleMenuUpdate}
    />
  );
}
