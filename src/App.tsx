import React, { useState } from "react";
import { LeftBar } from "./components/LeftBar";
import { ChatPanel } from "./components/ChatPanel";
import { Settings } from "./components/Settings";
import { Account } from "./components/Account";

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
}

function App() {
  const [showAccount, setShowAccount] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [setupStep, setSetupStep] = useState(1);
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails>(
    {
      name: "",
      contactNo: "",
      address: "",
      menu: null,
    }
  );

  const handleRestaurantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Restaurant details:", restaurantDetails);
    setShowSetup(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRestaurantDetails((prev) => ({
        ...prev,
        menu: e.target.files![0],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmedInput = input.trim();

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmedInput,
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate bot response with loading state
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `You said: ${trimmedInput}`,
        type: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-[#fff8f5] relative">
      <LeftBar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        messages={messages}
        setMessages={setMessages}
        setShowAccount={setShowAccount}
        setShowSetup={setShowSetup}
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

        {!showSetup && (
          <ChatPanel
            messages={messages}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            showAccount={showAccount}
          />
        )}
      </div>
    </div>
  );
}

export default App;
