import React, { useState, useEffect } from "react";
import { HelpCircle, ChevronRight, ArrowRight, Clock } from "lucide-react";
import { useOrderStore } from "../services/orderService";
import useAuthStore from "../store/useAuthStore";
import { getMostOrderedItems } from "../actions/serverActions";
import { toast } from "sonner";

export function Overview() {
  const { user } = useAuthStore();
  const { orders, loadOrders } = useOrderStore();
  const [salesData, setSalesData] = useState<{
    totalSales: number;
    totalOrders: number;
  }>({ totalSales: 0, totalOrders: 0 });
  const setActiveTab = useAuthStore((state) => state.setActiveTab);
  const [popularDishes, setPopularDishes] = useState<
    Array<{
      itemId: string;
      name: string;
      count: number;
      price: number;
    }>
  >([]);
  const [isLoadingDishes, setIsLoadingDishes] = useState(true);

  useEffect(() => {
    if (user?.adminId) {
      loadOrders(user.adminId);

      // Fetch most ordered items
      const fetchPopularDishes = async () => {
        try {
          const resData = await getMostOrderedItems(user.adminId, 5);
          setPopularDishes(resData.items);
          setSalesData({
            totalSales: resData.totalSales,
            totalOrders: resData.totalOrders,
          });
        } catch (error) {
          console.error("Error fetching popular dishes:", error);
          toast.error("Failed to load popular dishes");
        } finally {
          setIsLoadingDishes(false);
        }
      };

      fetchPopularDishes();
    }
  }, [user?.adminId, loadOrders]);

  const chartData = {
    dates: ["01 Nov", "02 Nov", "03 Nov", "04 Nov", "05 Nov", "06 Nov"],
    values: [4000, 4500, 2500, 6000, 4500, 3500],
  };

  const metrics = [
    {
      value: salesData.totalSales.toLocaleString(),
      label: "Total sales in AED",
    },
    {
      value: "1,300",
      label: "Highest sale in a day",
    },
    {
      value: salesData.totalOrders.toLocaleString(),
      label: "Completed orders",
    },
    {
      value: "222",
      label: "Total customers",
    },
  ];

  return (
    <div className="flex-1 p-8 space-y-6">
      <div className="grid grid-cols-[3fr_2fr] gap-6">
        {/* Left Section */}
        <div className="space-y-6 ">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-white p-6 rounded-3xl">
                <div className="space-y-2">
                  <h3 className="text-4xl font-bold">{metric.value}</h3>
                  <p className="text-gray-600">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Orders Section */}
          <div className="bg-white p-6 rounded-3xl ">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Active orders
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                  {orders.filter((o) => o.status !== "COMPLETED").length} Active
                </span>
              </h3>
              <button
                className="text-emerald-600 flex items-center gap-1 text-sm font-medium"
                onClick={() => setActiveTab("orders")}
              >
                Manage orders <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 h-[300px] overflow-y-auto">
              {orders
                .filter((order) => order.status !== "COMPLETED")
                .map((order, index) => (
                  <div
                    key={order._id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div
                      className={`h-10 rounded-lg flex items-center justify-center text-white font-medium px-2
                      ${
                        order.status === "PROCESSING"
                          ? "bg-yellow-500"
                          : order.status === "COOKING"
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    >
                      {order.orderId}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {order.customerDetails.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {order.items.length} items
                          </p>
                        </div>

                        <div className="flex flex-col justify-end items-center">
                          <div
                            className={`px-3 py-1 rounded-full text-sm
                          ${
                            order.status === "PROCESSING"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "COOKING"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                          >
                            {order.status === "PROCESSING"
                              ? "Waiting"
                              : order.status === "COOKING"
                              ? "Cooking Now"
                              : "Delivering"}
                          </div>

                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(order.updatedAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="space-y-6">
          {/* Players Card */}
          <div className="bg-white p-6 rounded-3xl overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Popular dishes
                {isLoadingDishes && (
                  <span className="text-sm text-gray-400">(Loading...)</span>
                )}
              </h3>
            </div>
            <div className="space-y-4">
              {popularDishes.map((dish, index) => (
                <div key={dish.itemId} className="flex items-center gap-4">
                  <div className="w-8 text-gray-400 text-sm">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <img
                      src={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${user?.restaurantId}/${user?.restaurantId}-${dish.itemId}.jpg`}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{dish.name}</h4>
                    <p className="text-sm text-gray-500">
                      Orders: {dish.count}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Card */}
          <div className="bg-[#DA3642] p-6 rounded-3xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold leading-tight">
                You've Unlocked
                <br />a New Feature!
              </h2>
              <div className="flex gap-4 mt-6">
                <div className="bg-emerald-50 bg-opacity-30 px-3 py-2 rounded-xl">
                  Enable now
                </div>
              </div>
            </div>
            <img
              src="https://newsroom.oobit.com/content/images/2023/09/Oobit_Tap.jpg"
              className="absolute right-0 bottom-0 h-32 rounded-bl-3xl"
              alt="Crypto payment"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
