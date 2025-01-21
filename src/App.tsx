import React, { useState } from "react";
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

interface RestaurantDetails {
  name: string;
  contactNo: string;
  address: string;
  menu: File | null;
  restaurantId: string;
}

function App() {
  const [showAccount, setShowAccount] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showMenuManagement, setShowMenuManagement] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [setupStep, setSetupStep] = useState(1);
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails>({
    name: "",
    contactNo: "",
    address: "",
    menu: null,
    restaurantId: "", // Initialize restaurantId
  });

  const handleRestaurantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Restaurant details:", restaurantDetails);
    setShowSetup(false);
    toast.success("Restaurant setup saved successfully!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRestaurantDetails((prev) => ({
        ...prev,
        menu: e.target.files![0],
      }));
      toast.success("File uploaded successfully!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      type: "user",
      timestamp: new Date(),
    };

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: `You said: ${input}`,
      type: "bot",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
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
          handleFileChange={handleFileChange}
        />

        <Account showAccount={showAccount} setShowAccount={setShowAccount} />

        {showMenuManagement && restaurantDetails.restaurantId ? (
          <MenuManagement restaurantId={restaurantDetails.restaurantId} />
        ) : (
          !showSetup && (
            <ChatPanel
              messages={messages}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              showAccount={showAccount}
            />
          )
        )}
      </div>
    </div>
  );
}

export default App;
