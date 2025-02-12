import {
  LayoutDashboard,
  ShoppingBag,
  Menu as MenuIcon,
  User,
  Wallet,
  HelpCircle,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import { updateRestaurantOnlineStatus } from "../actions/serverActions";
import useAuthStore from "../store/useAuthStore";

interface LeftBarProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  activeTab:
    | "overview"
    | "orders"
    | "menu"
    | "profile"
    | "payments"
    | "help"
    | "settings";
  setActiveTab: (
    tab: "orders" | "menu" | "profile" | "payments" | "help" | "settings"
  ) => void;
  restaurantId?: number;
  isOnline?: boolean;
  setRestaurantDetails?: (details: any) => void;
}

export function LeftBar({
  isExpanded,
  setIsExpanded,
  activeTab,
  setActiveTab,
  restaurantId,
  isOnline = false,
  setRestaurantDetails,
}: LeftBarProps) {
  const logout = useAuthStore((state) => state.logout);
  const { user } = useAuthStore();

  const navItems = [
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "menu", label: "Menu", icon: MenuIcon },
    { id: "profile", label: "Profile", icon: User },
    { id: "payments", label: "Payments", icon: Wallet },
    { id: "help", label: "Help", icon: HelpCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const toggleOnlineStatus = async () => {
    console.log(restaurantId);
    if (!user?.restaurantId) {
      toast.error("Restaurant ID not found");
      return;
    }

    if (!user?.username) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const result = await updateRestaurantOnlineStatus(
        user.restaurantId,
        user.username
      );

      if (setRestaurantDetails) {
        setRestaurantDetails((prev: any) => ({
          ...prev,
          isOnline: result.isOnline,
        }));
        toast.success(
          `Restaurant is now ${result.isOnline ? "online" : "offline"}`
        );
      }
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      toast.error("Failed to update restaurant status");
    }
  };

  return (
    <>
      <div
        className={`${
          isExpanded ? "w-64" : "w-16"
        } sidebar transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center">
          <h1
            className={`font-bold text-[#f15927] ${
              isExpanded ? "text-xl" : "text-sm"
            } flex items-center gap-2 text-red-600`}
          >
            {isExpanded ? (
              <>
                <span className="text-2xl">🍽️</span>
                <span>gobbl</span>
              </>
            ) : (
              "🍽️"
            )}
          </h1>
        </div>

        {/* Online/Offline Toggle */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={toggleOnlineStatus}
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
              isOnline
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Power className={`w-5 h-5 ${isExpanded ? "mr-3" : ""}`} />
            {isExpanded && (
              <span>
                {isOnline ? "Restaurant Online" : "Restaurant Offline"}
              </span>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4">
          <div className="px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-red-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isExpanded ? "mr-3" : ""}`} />
                  {isExpanded && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            onClick={() => {
              logout();
              toast.success("Logged out successfully");
            }}
          >
            <LogOut className={`w-5 h-5 ${isExpanded ? "mr-3" : ""}`} />
            {isExpanded && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute left-0 top-2 z-10 p-2 text-gray-500 hover:text-[#f15927] transition-all duration-300 ease-in-out"
        style={{ transform: `translateX(${isExpanded ? "240px" : "48px"})` }}
      >
        {isExpanded ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
      </button>
    </>
  );
}
