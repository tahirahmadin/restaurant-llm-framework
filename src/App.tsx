import React, { useState, useEffect } from "react";
import { LeftBar } from "./components/LeftBar";
import { ChatPanel } from "./components/ChatPanel";
import { Settings } from "./components/Settings";
import { Account } from "./components/Account";
import MenuManagement from "./components/MenuManagement";
import { Toaster, toast } from "sonner";

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

function App() {
  const [showAccount, setShowAccount] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showMenuManagement, setShowMenuManagement] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [setupStep, setSetupStep] = useState(1);

  // Initialize menuItems from localStorage
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const savedMenu = localStorage.getItem("restaurantMenu");
    return savedMenu ? JSON.parse(savedMenu) : [];
  });

  // Initialize customisations from localStorage
  const [customisations, setCustomisations] = useState<ItemCustomisation[]>(() => {
    const savedCustomisations = localStorage.getItem("customisations");
    return savedCustomisations ? JSON.parse(savedCustomisations) : [];
  });

  // Initialize restaurantDetails from localStorage
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails>(() => {
    const savedDetails = localStorage.getItem("restaurantDetails");
    return savedDetails ? JSON.parse(savedDetails) : {
      name: "",
      contactNo: "",
      address: "",
      menuSummary: "",  
      isOnline: false,
      menuUploaded: false,  
      menu: { File: null, extractedText: "" }
    };
  });

  // **Merging customisations with menuItems**
  const getMergedCustomisations = () => {
    return menuItems.map(item => {
      const found = customisations.find(c => c.id === item.id);
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
    localStorage.setItem("restaurantDetails", JSON.stringify(restaurantDetails));
    localStorage.setItem("mergedCustomisations", JSON.stringify(getMergedCustomisations()));
  }, [menuItems, customisations, restaurantDetails]);

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

  const handleMenuUpdate = (updatedMenu: MenuItem[], updatedCustomisations: ItemCustomisation[]) => {
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
    <div className="flex h-screen bg-[#fff8f5] relative">
      <Toaster position="top-right" />
      <LeftBar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        messages={messages}
        setMessages={setMessages}
        setShowAccount={setShowAccount}
        setShowSetup={setShowSetup}
        setShowMenuManagement={setShowMenuManagement}
        restaurantName={restaurantDetails.name}
        restaurantDetails={restaurantDetails}       // New prop
        setRestaurantDetails={setRestaurantDetails}
      />

      <div className="flex-1 flex flex-col">
        <Settings
          showSetup={showSetup}
          setShowSetup={setShowSetup}
          setupStep={setupStep}
          setSetupStep={setSetupStep}
          restaurantDetails={restaurantDetails}
          setRestaurantDetails={setRestaurantDetails}
          handleRestaurantSubmit={handleRestaurantSubmit}
          onMenuProcessed={handleMenuData}
        />

        <Account showAccount={showAccount} setShowAccount={setShowAccount} />

        {showMenuManagement ? (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowMenuManagement(false)} />
            <div className="relative min-h-screen bg-white ml-64">
              <MenuManagement
                restaurantId={restaurantDetails.restaurantId}
                restaurantName={restaurantDetails.name}
                initialMenuData={menuItems}
                initialCustomisations={customisations}
                onClose={() => setShowMenuManagement(false)}
                onUpdate={handleMenuUpdate}
              />
            </div>
          </div>
        ) : (
          !showSetup && (
            <ChatPanel
              messages={messages}
              input={input}
              setInput={setInput}
              handleSubmit={() => {}}
              showAccount={showAccount}
            />
          )
        )}
      </div>
    </div>
  );
}

export default App;
