import React, { useState, useEffect } from "react";

interface MenuItem {
  id: number;
  text: string;
  active: boolean;
}

interface MenuManagementProps {
  restaurantId: string; // Accept the restaurant ID as a prop
}

const MenuManagement: React.FC<MenuManagementProps> = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // API: Fetch Menu Items
  const fetchMenu = async () => {
    try {
      if (!restaurantId) throw new Error("Restaurant ID is missing");

      const apiUrl = import.meta.env.VITE_PUBLIC_GET_MENU_API_URL;
      if (!apiUrl) throw new Error("Backend API URL is not configured");

      const response = await fetch(`${apiUrl}?restaurantId=${restaurantId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.menuItems) throw new Error("No menu items received from server");

      setMenuItems(data.menuItems);
    } catch (err: any) {
      console.error("Error fetching menu:", err.message);
      setError(err.message || "Failed to fetch menu items");
    } finally {
      setLoading(false);
    }
  };

  // API: Update Menu Items
  const updateMenuItems = async (updates: { id: number; active: boolean }[]) => {
    try {
      const apiUrl = import.meta.env.VITE_PUBLIC_UPDATE_MENU_API_URL;
      if (!apiUrl) throw new Error("Backend API URL is not configured");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, updates }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (err: any) {
      console.error("Error updating menu:", err.message);
      setError(err.message || "Failed to update menu items");
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [restaurantId]);

  // Toggle Active Status
  const handleToggleActive = async (itemId: number, isActive: boolean) => {
    try {
      await updateMenuItems([{ id: itemId, active: !isActive }]);
      setMenuItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, active: !isActive } : item
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to update menu item");
    }
  };

  // Bulk Update
  const handleBulkUpdate = async (activate: boolean) => {
    try {
      await updateMenuItems(
        selectedItems.map((id) => ({ id, active: activate }))
      );
      setMenuItems((prevItems) =>
        prevItems.map((item) =>
          selectedItems.includes(item.id) ? { ...item, active: activate } : item
        )
      );
      setSelectedItems([]);
    } catch (err: any) {
      setError(err.message || "Failed to update menu items");
    }
  };

  // Select/Deselect Items
  const handleSelectItem = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === menuItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(menuItems.map((item) => item.id));
    }
  };

  if (loading) return <div>Loading menu...</div>;
  if (error)
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
        Error: {error}
        <button
          className="ml-4 text-blue-500 underline"
          onClick={() => setError(null)}
        >
          Dismiss
        </button>
      </div>
    );

  return (
    <div className="menu-management p-4">
      <h2 className="text-lg font-bold mb-4">Menu Management</h2>

      <div className="flex justify-between mb-4">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          onClick={() => handleBulkUpdate(true)}
          disabled={selectedItems.length === 0}
        >
          Activate Selected
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
          onClick={() => handleBulkUpdate(false)}
          disabled={selectedItems.length === 0}
        >
          Deactivate Selected
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr>
            <th className="border border-gray-200 p-2">
              <input
                type="checkbox"
                checked={selectedItems.length === menuItems.length}
                onChange={handleSelectAll}
              />
            </th>
            <th className="border border-gray-200 p-2">ID</th>
            <th className="border border-gray-200 p-2">Name</th>
            <th className="border border-gray-200 p-2">Active</th>
            <th className="border border-gray-200 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {menuItems.map((item) => (
            <tr key={item.id}>
              <td className="border border-gray-200 p-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                />
              </td>
              <td className="border border-gray-200 p-2">{item.id}</td>
              <td className="border border-gray-200 p-2">{item.text}</td>
              <td className="border border-gray-200 p-2">
                {item.active ? "Yes" : "No"}
              </td>
              <td className="border border-gray-200 p-2">
                <button
                  className="text-blue-500 underline"
                  onClick={() => handleToggleActive(item.id, item.active)}
                >
                  {item.active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MenuManagement;
