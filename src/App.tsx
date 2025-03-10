import React, { useState, useEffect } from "react";
import { LeftBar } from "./components/LeftBar";
import { Overview } from "./components/Overview";
import { Orders } from "./components/Orders";
import { Menu } from "./components/Menu";
import { Profile } from "./components/Profile";
import { Payments } from "./components/Payments";
import { Services } from "./components/Services";
import { Delivery } from "./components/Delivery";
import { Help } from "./components/Help";
import { Toaster } from "sonner";
import { AuthWrapper } from "./components/auth/AuthWrapper";
import useAuthStore from "./store/useAuthStore";
import useRestaurantStore from "./store/useRestaurantStore";

function App() {
  const { user } = useAuthStore();
  const activeTab = useAuthStore((state) => state.activeTab);
  const setActiveTab = useAuthStore((state) => state.setActiveTab);
  const [isExpanded, setIsExpanded] = useState(true);
  const { profile, loadProfile } = useRestaurantStore();

  useEffect(() => {
    if (user?.restaurantId) {
      loadProfile(user.restaurantId);
    }
  }, [user?.restaurantId, loadProfile]);

  return (
    <AuthWrapper>
      <div className="flex h-screen bg-[#F1F1F1] overflow-hidden">
        <Toaster position="top-right" />
        <LeftBar
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          restaurantId={profile?.restaurantId}
          isOnline={profile?.isOnline}
        />
        <div className="flex-1 flex flex-col overflow-y-auto">
          {activeTab === "overview" && <Overview />}
          {activeTab === "orders" && <Orders />}
          {activeTab === "menu" && <Menu />}
          {activeTab === "delivery" && <Delivery />}
          {activeTab === "profile" && <Profile />}
          {activeTab === "payments" && <Payments />}
          {activeTab === "services" && <Services />}
          {activeTab === "help" && <Help />}
        </div>
      </div>
    </AuthWrapper>
  );
}

export default App;
