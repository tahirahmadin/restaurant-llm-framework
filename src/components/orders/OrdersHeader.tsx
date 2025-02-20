import React from "react";
import { Search, RefreshCcw, X } from "lucide-react";
import { LiveClock } from "./LiveClock";

interface OrdersHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOrder: "newest" | "oldest";
  setSortOrder: (order: "newest" | "oldest") => void;
  onRefresh: () => void;
  loading: boolean;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  onRefresh,
  loading,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 transition-all duration-300">
            Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your restaurant orders
          </p>
        </div>
        <LiveClock />
      </div>
      <div className="flex items-center space-x-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors duration-200 bg-white text-gray-900"
          />
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 focus:outline-none"
          aria-label="Refresh orders"
          title="Refresh orders"
        >
          <RefreshCcw className="w-5 h-5 text-gray-600" />
        </button>

        {/* Sort Dropdown */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors bg-white text-gray-900"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
};
