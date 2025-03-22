import {
  LayoutDashboard,
  ShoppingBag,
  Building2,
  Menu as MenuIcon,
  Bike,
  User,
  Wallet,
  HelpCircle,
  Settings,
  Store,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Power,
  LayoutDashboardIcon,
} from "lucide-react";
import { toast } from "sonner";
import { updateRestaurantOnlineStatus } from "../actions/serverActions";
import useAuthStore from "../store/useAuthStore";
import useRestaurantStore from "../store/useRestaurantStore";
import { validateRestaurantOnlineStatus } from "../utils/onlineValidation";

interface LeftBarProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  activeTab:
    | "overview"
    | "orders"
    | "menu"
    | "services"
    | "profile"
    | "payments"
    | "help"
    | "delivery";
  setActiveTab: (
    tab:
      | "overview"
      | "orders"
      | "menu"
      | "services"
      | "profile"
      | "payments"
      | "help"
      | "delivery"
  ) => void;
  email?: string;
  isOnline?: boolean;
}

export function LeftBar({
  isExpanded,
  setIsExpanded,
  activeTab,
  setActiveTab,
  email,
  isOnline = false,
}: LeftBarProps) {
  const logout = useAuthStore((state) => state.logout);
  const { user } = useAuthStore();
  const { profile, setProfile } = useRestaurantStore();

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboardIcon },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "menu", label: "Menu", icon: MenuIcon },
    { id: "entities", label: "Entities", icon: Building2 },
    { id: "delivery", label: "Delivery", icon: Bike },
    { id: "profile", label: "Profile", icon: User },
    { id: "services", label: "Services", icon: Store },
    { id: "payments", label: "Payments", icon: Wallet },
    { id: "help", label: "Help", icon: HelpCircle },
  ];

  const toggleOnlineStatus = async () => {
    if (!user?.email) {
      toast.error("User email not found");
      return;
    }

    if (!user?.email) {
      toast.error("User not authenticated");
      return;
    }

    try {
      // Validate the profile directly since it has all required fields
      const validation = validateRestaurantOnlineStatus(profile!);

      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }

      const result = await updateRestaurantOnlineStatus(user.email);

      // Update profile in store
      setProfile({
        ...profile!,
        isOnline: result.isOnline,
      });

      toast.success(
        `Restaurant is now ${result.isOnline ? "online" : "offline"}`
      );
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
        } sidebar transition-all duration-300 flex flex-col bg-white`}
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
            className={`w-[80%] flex items-center px-3 py-2 rounded-lg transition-colors ${
              isOnline
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Power className={`w-5 h-5 ${isExpanded ? "mr-3" : ""}`} />
            {isExpanded && <span>{isOnline ? "Online" : "Offline"}</span>}
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
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-[80%] flex items-center px-3 py-2 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-[#DA3642] text-white"
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
