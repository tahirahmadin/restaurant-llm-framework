import React, { useState } from "react";
import {
  Search,
  Pizza,
  Merge as Burger,
  Coffee,
  Cookie,
  Wine,
  Plus,
  Minus,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: number;
  crust?: string;
  spiciness: number;
  ingredients: string[];
  customizationOptions: {
    category: string;
    options: { name: string; price: number }[];
  }[];
}

export function Menu() {
  const [activeCategory, setActiveCategory] = useState("Pizza");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const categories = [
    { id: "pizza", label: "Pizza", icon: Pizza },
    { id: "burger", label: "Burger", icon: Burger },
    { id: "rice", label: "Rice", icon: Coffee },
    { id: "snacks", label: "Snacks", icon: Cookie },
    { id: "drinks", label: "Drinks", icon: Wine },
  ];

  const menuItems: MenuItem[] = [
    {
      id: "1",
      name: "American Favorite",
      description:
        "Classic American-style pizza with a perfect blend of premium toppings",
      price: 5.87,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&h=200",
      category: "Pizza",
      available: 18,
      crust: "Stuffed Crust Extra",
      spiciness: 2,
      ingredients: [
        "Mozzarella",
        "Pepperoni",
        "Bell Peppers",
        "Mushrooms",
        "Onions",
      ],
      customizationOptions: [
        {
          category: "Crust",
          options: [
            { name: "Thin Crust", price: 0 },
            { name: "Stuffed Crust", price: 2 },
            { name: "Pan", price: 1 },
          ],
        },
        {
          category: "Extra Toppings",
          options: [
            { name: "Extra Cheese", price: 1.5 },
            { name: "Pepperoni", price: 2 },
            { name: "Mushrooms", price: 1 },
            { name: "Onions", price: 0.5 },
          ],
        },
      ],
    },
    {
      id: "2",
      name: "Chicken Mushroom",
      description:
        "Classic American-style pizza with a perfect blend of premium toppings",
      price: 5.87,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&h=200",
      category: "Pizza",
      available: 9,
      spiciness: 2,
      ingredients: [
        "Mozzarella",
        "Pepperoni",
        "Bell Peppers",
        "Mushrooms",
        "Onions",
      ],
      customizationOptions: [
        {
          category: "Crust",
          options: [
            { name: "Thin Crust", price: 0 },
            { name: "Stuffed Crust", price: 2 },
            { name: "Pan", price: 1 },
          ],
        },
        {
          category: "Extra Toppings",
          options: [
            { name: "Extra Cheese", price: 1.5 },
            { name: "Pepperoni", price: 2 },
            { name: "Mushrooms", price: 1 },
            { name: "Onions", price: 0.5 },
          ],
        },
      ],
    },
    {
      id: "3",
      name: "Favorite Cheese",
      description:
        "Classic American-style pizza with a perfect blend of premium toppings",
      price: 6.57,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&h=200",
      category: "Pizza",
      available: 7,
      crust: "Stuffed Crust Swiss",
      spiciness: 2,
      ingredients: [
        "Mozzarella",
        "Pepperoni",
        "Bell Peppers",
        "Mushrooms",
        "Onions",
      ],
      customizationOptions: [
        {
          category: "Crust",
          options: [
            { name: "Thin Crust", price: 0 },
            { name: "Stuffed Crust", price: 2 },
            { name: "Pan", price: 1 },
          ],
        },
        {
          category: "Extra Toppings",
          options: [
            { name: "Extra Cheese", price: 1.5 },
            { name: "Pepperoni", price: 2 },
            { name: "Mushrooms", price: 1 },
            { name: "Onions", price: 0.5 },
          ],
        },
      ],
    },
    {
      id: "4",
      name: "Meat Lovers",
      description:
        "Classic American-style pizza with a perfect blend of premium toppings",
      price: 6.37,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&h=200",
      category: "Pizza",
      available: 14,
      spiciness: 2,
      ingredients: [
        "Mozzarella",
        "Pepperoni",
        "Bell Peppers",
        "Mushrooms",
        "Onions",
      ],
      customizationOptions: [
        {
          category: "Crust",
          options: [
            { name: "Thin Crust", price: 0 },
            { name: "Stuffed Crust", price: 2 },
            { name: "Pan", price: 1 },
          ],
        },
        {
          category: "Extra Toppings",
          options: [
            { name: "Extra Cheese", price: 1.5 },
            { name: "Pepperoni", price: 2 },
            { name: "Mushrooms", price: 1 },
            { name: "Onions", price: 0.5 },
          ],
        },
      ],
    },
    {
      id: "5",
      name: "Super Supreme",
      description:
        "Classic American-style pizza with a perfect blend of premium toppings",
      price: 5.75,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&h=200",
      category: "Pizza",
      available: 10,
      crust: "Stuffed Crust Cheese",
      spiciness: 2,
      ingredients: [
        "Mozzarella",
        "Pepperoni",
        "Bell Peppers",
        "Mushrooms",
        "Onions",
      ],
      customizationOptions: [
        {
          category: "Crust",
          options: [
            { name: "Thin Crust", price: 0 },
            { name: "Stuffed Crust", price: 2 },
            { name: "Pan", price: 1 },
          ],
        },
        {
          category: "Extra Toppings",
          options: [
            { name: "Extra Cheese", price: 1.5 },
            { name: "Pepperoni", price: 2 },
            { name: "Mushrooms", price: 1 },
            { name: "Onions", price: 0.5 },
          ],
        },
      ],
    },
    {
      id: "6",
      name: "Ultimate Cheese",
      description:
        "Classic American-style pizza with a perfect blend of premium toppings",
      price: 5.27,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&h=200",
      category: "Pizza",
      available: 8,
      spiciness: 2,
      ingredients: [
        "Mozzarella",
        "Pepperoni",
        "Bell Peppers",
        "Mushrooms",
        "Onions",
      ],
      customizationOptions: [
        {
          category: "Crust",
          options: [
            { name: "Thin Crust", price: 0 },
            { name: "Stuffed Crust", price: 2 },
            { name: "Pan", price: 1 },
          ],
        },
        {
          category: "Extra Toppings",
          options: [
            { name: "Extra Cheese", price: 1.5 },
            { name: "Pepperoni", price: 2 },
            { name: "Mushrooms", price: 1 },
            { name: "Onions", price: 0.5 },
          ],
        },
      ],
    },
  ];

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Menu */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search category or menu"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f15927]"
            />
          </div>

          {/* Out of Stock Alert */}
          <div className="mb-6 text-[#f15927] text-sm font-medium">
            5 items out of stocks
          </div>

          {/* Categories */}
          <div className="flex gap-6 mb-8 overflow-x-auto pb-2">
            {categories.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(label)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl min-w-[80px] ${
                  activeCategory === label
                    ? "bg-[#f15927] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Section Title */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Choose Pizza</h2>
            <span className="text-sm text-gray-500">10 Pizza Result</span>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                onClick={() => handleSelectItem(item)}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full aspect-square object-cover rounded-xl mb-4"
                />
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <div className="text-[#f15927] font-semibold mb-2">
                    ${item.price}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.available} Pan Available
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Current Order */}
      <div className="w-80 border-l border-gray-200 p-6 bg-white">
        {selectedItem ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">
                {selectedItem.name}
              </h2>
              <p className="text-gray-600">{selectedItem.description}</p>
            </div>

            {/* Item Image */}
            <div className="mb-6">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="w-full h-48 rounded-lg object-cover"
              />
            </div>

            {/* Item Details */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Details</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-500">Base Price:</span>{" "}
                  <span className="font-medium">${selectedItem.price}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Spiciness:</span>{" "}
                  <span className="font-medium">
                    {"🌶️".repeat(selectedItem.spiciness)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Available:</span>{" "}
                  <span className="font-medium">
                    {selectedItem.available} pieces
                  </span>
                </p>
              </div>
            </div>

            {/* Ingredients */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {selectedItem.ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-orange-50 text-[#f15927] rounded-full text-sm"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>

            {/* Customization Options */}
            <div>
              <h3 className="font-medium mb-4">Customization Options</h3>
              {selectedItem.customizationOptions.map((category, index) => (
                <div key={index} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {category.category}
                  </h4>
                  <div className="space-y-2">
                    {category.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-[#f15927] rounded border-gray-300 focus:ring-[#f15927]"
                          />
                          <span className="ml-2 text-sm">{option.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          +${option.price.toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select an item to view details
          </div>
        )}
      </div>
    </div>
  );
}
