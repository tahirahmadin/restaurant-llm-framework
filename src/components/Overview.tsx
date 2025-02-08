import React, { useState } from "react";
import {
  Search,
  Bell,
  Calendar,
  Download,
  ChevronDown,
  Info,
} from "lucide-react";

export function Overview() {
  const [timeFilter, setTimeFilter] = useState("Last 30 days");

  const stats = [
    {
      title: "Fresh Orders",
      value: "3",
      subtext: "orders",
      change: 0,
      icon: "🆕",
    },
    {
      title: "Cooking",
      value: "1",
      subtext: "orders",
      change: 0,
      icon: "👨‍🍳",
    },
    {
      title: "Completed",
      value: "1",
      subtext: "orders",
      change: 0,
      icon: "✅",
    },
  ];

  const orderHistory = [
    {
      id: "#12345678",
      status: "Completed",
      date: "1/10/2024 at 5:12 PM",
      amount: 32.85,
    },
    { id: "#907655", status: "Completed", date: "20:40pm", amount: 35.08 },
    { id: "#907654", status: "Cooking", date: "20:35pm", amount: 45.08 },
    { id: "#907653", status: "Fresh", date: "20:30pm", amount: 40.49 },
  ];

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Hello, Mike!</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search anything here..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 w-64 focus:outline-none focus:ring-2 focus:ring-[#f15927]"
            />
          </div>
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filters & Export */}
      <div className="flex items-center justify-between mb-6">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <Calendar className="w-4 h-4" />
          <span>{timeFilter}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#f15927] text-white rounded-lg hover:bg-[#d94d1f]">
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <h3 className="text-2xl font-semibold mt-1">
                  {stat.value}{" "}
                  <span className="text-gray-500 text-lg">{stat.subtext}</span>
                </h3>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div
              className={`text-sm ${
                stat.change >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {stat.change >= 0 ? "↑" : "↓"} {Math.abs(stat.change)}% vs past
              month
            </div>
          </div>
        ))}
      </div>

      {/* Orders History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Orders history</h2>
          <button className="text-green-500 hover:text-green-600 text-sm">
            more →
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-600 text-sm">
              <th className="pb-4">Order number</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Date and Time</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Info</th>
            </tr>
          </thead>
          <tbody>
            {orderHistory.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="py-4">{order.id}</td>
                <td className="py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-sm
                    ${
                      order.status === "Completed"
                        ? "bg-green-100 text-green-600"
                        : order.status === "Cooking"
                        ? "bg-orange-100 text-[#f15927]"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="py-4 text-gray-600">{order.date}</td>
                <td className="py-4">${order.amount.toFixed(2)}</td>
                <td className="py-4">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Info className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
