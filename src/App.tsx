import React, { useState, useEffect } from "react";
import { LeftBar } from "./components/LeftBar";
import { Overview } from "./components/Overview";
import { Orders } from "./components/Orders";
import { Menu } from "./components/Menu";
import { Profile } from "./components/Profile";
import { Payments } from "./components/Payments";
import { Help } from "./components/Help";
import { Toaster, toast } from "sonner";
import { Settings } from "./components/Settings";
import { AuthWrapper } from "./components/auth/AuthWrapper";
import useAuthStore from "./store/useAuthStore";

interface Message {
  id: string;
  content: string;
  type: "user" | "bot";
  timestamp: Date;
}

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
  restaurantId?: number;
  name: string;
  contactNo: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isOnline?: boolean;
  menu?: {
    File?: File | null;
    extractedText?: string;
  };
}

type TabType =
  | "overview"
  | "orders"
  | "menu"
  | "profile"
  | "payments"
  | "help"
  | "settings";

function App() {
  const { user } = useAuthStore();
  const activeTab = useAuthStore((state) => state.activeTab);
  const setActiveTab = useAuthStore((state) => state.setActiveTab);
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [setupStep, setSetupStep] = useState(1);
  const [showSetup, setShowSetup] = useState(true);

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
      if (user?.restaurantId) {
        const savedDetails = localStorage.getItem("restaurantDetails");
        return savedDetails
          ? JSON.parse(savedDetails)
          : {
              restaurantId: user.restaurantId,
              name: "",
              contactNo: "",
              address: "",
              isOnline: false,
              menuUploaded: false,
              menu: { File: null, extractedText: "" },
            };
      }
      return {
            name: "",
            contactNo: "",
            address: "",
            isOnline: false,
            menuUploaded: false,
            menu: { File: null, extractedText: "" },
          };
    },
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
  }, [menuItems, customisations, restaurantDetails]);

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
    <AuthWrapper>
    <div className="flex h-screen bg-[#fff8f5] relative">
      <Toaster position="top-right" />
      <LeftBar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        restaurantId={restaurantDetails.restaurantId}  
        isOnline={restaurantDetails.isOnline}         
        setRestaurantDetails={setRestaurantDetails}
      />
      <div className="flex-1 flex flex-col">
        {activeTab === "overview" && <Overview />}
        {activeTab === "orders" && <Orders />}
        {activeTab === "menu" && <Menu />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "payments" && <Payments />}
        {activeTab === "help" && <Help />}
        {activeTab === "settings" && (
          <Settings
            showSetup={showSetup}
            setShowSetup={setShowSetup}
            setupStep={setupStep}
            setSetupStep={setSetupStep}
            restaurantDetails={restaurantDetails}
            setRestaurantDetails={setRestaurantDetails}
            onMenuProcessed={handleMenuData}
          />
        )}
      </div>
    </div>
    </AuthWrapper>
  );
}

export default App;
