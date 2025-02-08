import React, { useState, useEffect } from "react";
import { LeftBar } from "./components/LeftBar";
import { Overview } from "./components/Overview";
import { Orders } from "./components/Orders";
import { Menu } from "./components/Menu";
import { Profile } from "./components/Profile";
import { Payments } from "./components/Payments";
import { Help } from "./components/Help";
import { Settings } from "./components/Settings";
import { Toaster, toast } from "sonner";

type TabType =
  | "overview"
  | "orders"
  | "menu"
  | "profile"
  | "payments"
  | "help"
  | "settings";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex h-screen bg-[#fff8f5] relative">
      <Toaster position="top-right" />
      <LeftBar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <div className="flex-1 flex flex-col">
        {activeTab === "overview" && <Overview />}
        {activeTab === "orders" && <Orders />}
        {activeTab === "menu" && <Menu />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "payments" && <Payments />}
        {activeTab === "help" && <Help />}
        {activeTab === "settings" && <Settings />}
      </div>
    </div>
  );
}

export default App;
