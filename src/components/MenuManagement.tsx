import React, { useState, useEffect } from "react";
import { Trash2, Save, Plus, ImageIcon, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import ImageUploader from "./ImageUploader";
import { API_URL } from "../config";
import {
  updateMenuItem,
  addMenuItem,
  getRestaurantMenu,
  deleteMenuItem,
} from "../actions/serverActions";

import useAuthStore from "../store/useAuthStore";

/* ------------------------------------------------------------------
   1) Main MenuItem data (no built-in customizations)
   ------------------------------------------------------------------ */
interface MenuItem {
  id?: number;
  isNew?: boolean;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  spicinessLevel: number;
  sweetnessLevel: number;
  dietaryPreference: string[];
  healthinessScore: number;
  caffeineLevel: string;
  sufficientFor: number;
  available: boolean;
  isCustomisable?: boolean;
}

const emptyMenuItem: MenuItem = {
  id: 0,
  name: "",
  description: "",
  category: "",
  price: 0,
  image: "",
  spicinessLevel: 0,
  sweetnessLevel: 0,
  dietaryPreference: [],
  healthinessScore: 0,
  caffeineLevel: "",
  sufficientFor: 1,
  available: true,
};

const orderedColumns = [
  "name",
  "description",
  "category",
  "price",
  "image",
  "spicinessLevel",
  "sweetnessLevel",
  "dietaryPreference",
  "healthinessScore",
  "caffeineLevel",
  "sufficientFor",
  "available",
] as const;

/* ------------------------------------------------------------------
   2) The separate JSON for customizations:
      - Each Category has a single minQuantity, maxQuantity
      - Each Item has only name and price
   ------------------------------------------------------------------ */
interface AddOnItem {
  name: string;
  price: number;
}

interface AddOnCategory {
  categoryName: string;
  minQuantity: number;
  maxQuantity: number;
  items: AddOnItem[];
}

interface ItemCustomisation {
  id: number; // matches the MenuItem's id
  customisation: {
    categories: AddOnCategory[];
  };
}

const emptyCustomisation: ItemCustomisation = {
  id: 0,
  customisation: {
    categories: [],
  },
};

/* ------------------------------------------------------------------
   3) Props for the main component
   ------------------------------------------------------------------ */
interface MenuManagementProps {
  restaurantId: number;
  restaurantName: string;
  initialMenuData?: MenuItem[];
  initialCustomisations?: ItemCustomisation[];
  onClose: () => void;
  // We'll pass updated menu & customisations back on save
  onUpdate: (menu: MenuItem[], customisations: ItemCustomisation[]) => void;
}

/* ------------------------------------------------------------------
   4) Main Component
   ------------------------------------------------------------------ */
const MenuManagement: React.FC<MenuManagementProps> = ({
  restaurantId,
  restaurantName,
  initialMenuData = [],
  initialCustomisations = [],
  onClose,
  onUpdate,
}) => {
  // A) Menu items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  // B) Customisations
  const [customisations, setCustomisations] = useState<ItemCustomisation[]>([]);
  // C) UI state
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  // We'll store the ID of the item we're about to delete (for confirmation).
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<number | null>(
    null
  );

  // Load initial data once
  useEffect(() => {
    setMenuItems(initialMenuData);
    setCustomisations(initialCustomisations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group items by category for the left sidebar
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as { [key: string]: MenuItem[] });

  /* ------------------------------------------------------------------
     5) Generate new ID for new MenuItems
  */
  // const generateNewId = (): number => {
  //   const existingIds = menuItems.map((m) => m.id);
  //   return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  // };

  /* ------------------------------------------------------------------
     6) CRUD for the main menu items
  */
  const addNewRow = (category = "") => {
    const newItem = {
      ...emptyMenuItem,
      isNew: true, // Mark it as a brand-new client-side item
      category,
    };
    setMenuItems((prev) => [...prev, newItem]);
    setSelectedItem(newItem);

    // Create a blank customization for this item
    const newCustom: ItemCustomisation = {
      ...emptyCustomisation,
      id: undefined,
    };
    setCustomisations((prev) => [...prev, newCustom]);

    setHasChanges(true);
  };

  // Editing built-in MenuItem fields
  const handleFieldEdit = (
    itemId: number,
    field: keyof MenuItem,
    value: any
  ) => {
    // For spicinessLevel, sweetnessLevel, or healthinessScore -> clamp to 0–5
    if (
      ["spicinessLevel", "sweetnessLevel", "healthinessScore"].includes(field)
    ) {
      let numericVal = Number(value);
      if (numericVal < 0) numericVal = 0;
      if (numericVal > 5) numericVal = 5;
      value = numericVal;
    }

    const updated = menuItems.map((item) =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setMenuItems(updated);

    // Update the selected item if it matches
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem({ ...selectedItem, [field]: value });
    }
    setHasChanges(true);
  };

  // Instead of directly deleting, show the confirmation modal:
  const handleDeleteIconClick = (itemId: number) => {
    setConfirmDeleteItemId(itemId);
  };

  // This runs when user confirms "Yes" in the modal
  const confirmDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      const { user } = useAuthStore.getState();

      if (!user?.username) {
        toast.error("User not authenticated");
        return;
      }

      await deleteMenuItem(
        Number(restaurantId),
        Number(selectedItem.id),
        user.username
      );

      const updatedMenu = await getRestaurantMenu(restaurantId);

      setMenuItems(updatedMenu);
      setSelectedItem(null);
      setConfirmDeleteItemId(null);

      onUpdate(updatedMenu, customisations);

      toast.success("Item deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error(error.message || "Failed to delete item");
    }
  };

  // If user clicks "No"
  const cancelDeleteItem = () => {
    setConfirmDeleteItemId(null);
  };

  const validateMenuItem = (
    item: MenuItem
  ): { isValid: boolean; invalidFields: string[] } => {
    const invalidFields: string[] = [];

    if (!item.name || item.name.trim() === "") {
      invalidFields.push("name");
    }
    if (!item.description || item.description.trim() === "") {
      invalidFields.push("description");
    }
    if (!item.category || item.category.trim() === "") {
      invalidFields.push("category");
    }
    if (item.price <= 0) {
      invalidFields.push("price");
    }
    if (!item.image || item.image.trim() === "") {
      invalidFields.push("image");
    }
    // if (item.spicinessLevel < 0 || item.spicinessLevel > 5) {
    //   invalidFields.push('spicinessLevel');
    // }
    // if (item.sweetnessLevel < 0 || item.sweetnessLevel > 5) {
    //   invalidFields.push('sweetnessLevel');
    // }
    if (!item.dietaryPreference || item.dietaryPreference.length === 0) {
      invalidFields.push("dietaryPreference");
    }
    // if (item.healthinessScore < 0 || item.healthinessScore > 5) {
    //   invalidFields.push('healthinessScore');
    // }
    // if (!item.caffeineLevel || item.caffeineLevel.trim() === '') {
    //   invalidFields.push('caffeineLevel');
    // }
    // if (item.sufficientFor <= 0) {
    //   invalidFields.push('sufficientFor');
    // }

    return {
      isValid: invalidFields.length === 0,
      invalidFields,
    };
  };

  // Manually save changes
  const handleSaveChanges = async () => {
    const { user } = useAuthStore.getState();

    try {
      if (!selectedItem) {
        toast.error("No item selected");
        return;
      }

      if (!user?.username) {
        toast.error("User not authenticated");
        return;
      }

      const validation = validateMenuItem(selectedItem);
      if (!validation.isValid) {
        setInvalidFields(validation.invalidFields);
        toast.error("Please fill in all item details");
        return;
      }

      setInvalidFields([]);

      const customisationForItem = customisations.find(
        (c) => c.id === selectedItem.id
      );

      const isCustomisable =
        customisationForItem &&
        customisationForItem.customisation.categories.length > 0;

      const payload = {
        id: selectedItem.id,
        name: selectedItem.name,
        description: selectedItem.description,
        category: selectedItem.category,
        price: Number(selectedItem.price),
        image: selectedItem.image,
        spicinessLevel: Number(selectedItem.spicinessLevel),
        sweetnessLevel: Number(selectedItem.sweetnessLevel),
        dietaryPreference: selectedItem.dietaryPreference,
        healthinessScore: Number(selectedItem.healthinessScore),
        caffeineLevel: selectedItem.caffeineLevel,
        sufficientFor: Number(selectedItem.sufficientFor),
        available: Boolean(selectedItem.available),
        isCustomisable: isCustomisable,
        adminUsername: user.username,
        customisation: customisationForItem
          ? customisationForItem.customisation
          : { categories: [] },
      };

      const updatedItem = await updateMenuItem(
        Number(restaurantId),
        selectedItem.id,
        payload
      );

      const mergedItem = { ...updatedItem, id: selectedItem.id };

      const updatedMenuItems = menuItems.map((item) =>
        item.id === selectedItem.id ? mergedItem : item
      );

      onUpdate(updatedMenuItems, customisations);
      toast.success("Item updated successfully!");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save changes"
      );
    }
  };

  const handleAddNewItemToServer = async () => {
    const { user } = useAuthStore.getState();

    try {
      if (!selectedItem) {
        toast.error("No item selected");
        return;
      }
      if (!user?.username) {
        toast.error("User not authenticated");
        return;
      }

      if (!selectedItem.isNew) {
        toast.error("This item is not marked as new.");
        return;
      }

      const validation = validateMenuItem(selectedItem);
      if (!validation.isValid) {
        setInvalidFields(validation.invalidFields);
        toast.error("Please fill in all item details");
        return;
      }

      setInvalidFields([]);

      const { id, ...selectedItemWithoutId } = selectedItem;

      const customisationForItem = customisations.find(
        (c) => c.id === undefined
      );

      const isCustomisable = Boolean(
        customisationForItem &&
          customisationForItem.customisation.categories &&
          customisationForItem.customisation.categories.length > 0
      );

      const payload = {
        name: selectedItemWithoutId.name,
        description: selectedItemWithoutId.description,
        category: selectedItemWithoutId.category,
        price: Number(selectedItemWithoutId.price),
        image: selectedItemWithoutId.image,
        spicinessLevel: Number(selectedItemWithoutId.spicinessLevel),
        sweetnessLevel: Number(selectedItemWithoutId.sweetnessLevel),
        dietaryPreference: selectedItemWithoutId.dietaryPreference,
        healthinessScore: Number(selectedItemWithoutId.healthinessScore),
        caffeineLevel: selectedItemWithoutId.caffeineLevel,
        sufficientFor: Number(selectedItemWithoutId.sufficientFor),
        available: Boolean(selectedItemWithoutId.available),
        isCustomisable,
        adminUsername: user.username,
        customisation: customisationForItem
          ? customisationForItem.customisation
          : { categories: [] },
      };

      console.log("Payload being sent:", payload);

      const newlyCreatedItem = await addMenuItem(restaurantId, payload);

      const updatedMenu = await getRestaurantMenu(restaurantId);

      const updatedCustoms = customisations.map((c) =>
        c.id === undefined ? { ...c, id: newlyCreatedItem.id } : c
      );

      setMenuItems(updatedMenu);
      setCustomisations(updatedCustoms);
      setSelectedItem({
        ...selectedItemWithoutId,
        ...newlyCreatedItem,
        isNew: false,
      });
      setHasChanges(false);
      setSelectedItem(null);

      // Notify parent
      onUpdate(updatedMenu, updatedCustoms);

      toast.success("New item added successfully!");
    } catch (error: any) {
      console.error("Error adding new item:", error);
      toast.error(error.message || "Failed to add new item");
    }
  };

  // Expand/collapse categories in the sidebar
  const toggleCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? "" : category);
  };

  /* ------------------------------------------------------------------
     7) Manage separate customisations
  */
  // Get or create the custom data for an item
  const getCustomisationById = (itemId: number): ItemCustomisation => {
    let found = customisations.find((c) => c.id === itemId);
    if (!found) {
      found = { ...emptyCustomisation, id: itemId };
      setCustomisations((prev) => [...prev, found!]);
    }
    return found!;
  };

  // Overwrite that custom object
  const setCustomisationForItem = (updated: ItemCustomisation) => {
    setCustomisations((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
  };

  // Add a new category (with its own min/max)
  const addNewCategory = (itemId: number) => {
    const customData = getCustomisationById(itemId);
    const newCats = [
      ...customData.customisation.categories,
      {
        categoryName: "New Category",
        minQuantity: 0,
        maxQuantity: 1,
        items: [],
      },
    ];
    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: newCats },
    };
    setCustomisationForItem(updated);
    setHasChanges(true);
  };

  // Remove a category
  const removeCategory = (itemId: number, catIndex: number) => {
    const customData = getCustomisationById(itemId);
    const newCats = [...customData.customisation.categories];
    newCats.splice(catIndex, 1);

    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: newCats },
    };
    setCustomisationForItem(updated);
    setHasChanges(true);
  };

  // Edit category name or min/max
  const handleCategoryFieldChange = (
    itemId: number,
    catIndex: number,
    field: keyof AddOnCategory,
    val: string
  ) => {
    const customData = getCustomisationById(itemId);
    const updatedCats = customData.customisation.categories.map((cat, idx) => {
      if (idx !== catIndex) return cat;
      // If it's min/max, parse digits only
      if (field === "minQuantity" || field === "maxQuantity") {
        const onlyNums = val.replace(/[^\d]/g, "");
        const parsed = parseInt(onlyNums, 10) || 0;
        return { ...cat, [field]: parsed };
      } else if (field === "categoryName") {
        return { ...cat, categoryName: val };
      }
      return cat;
    });

    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: updatedCats },
    };
    setCustomisationForItem(updated);
    setHasChanges(true);
  };

  // Add an item inside a category
  const addNewItem = (itemId: number, catIndex: number) => {
    const customData = getCustomisationById(itemId);
    const updatedCats = customData.customisation.categories.map((cat, idx) => {
      if (idx !== catIndex) return cat;
      return {
        ...cat,
        items: [
          ...cat.items,
          {
            name: "New Add-On",
            price: 0,
          },
        ],
      };
    });

    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: updatedCats },
    };
    setCustomisationForItem(updated);
    setHasChanges(true);
  };

  // Remove an item from a category
  const removeItem = (itemId: number, catIndex: number, itemIndex: number) => {
    const customData = getCustomisationById(itemId);
    const updatedCats = customData.customisation.categories.map((cat, idx) => {
      if (idx !== catIndex) return cat;
      const newItems = [...cat.items];
      newItems.splice(itemIndex, 1);
      return { ...cat, items: newItems };
    });

    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: updatedCats },
    };
    setCustomisationForItem(updated);
    setHasChanges(true);
  };

  // Edit item name or price
  const editItemField = (
    itemId: number,
    catIndex: number,
    itemIndex: number,
    field: keyof AddOnItem,
    val: string
  ) => {
    const customData = getCustomisationById(itemId);
    const updatedCats = customData.customisation.categories.map((cat, idx) => {
      if (idx !== catIndex) return cat;

      const newItems = cat.items.map((itm, iIdx) => {
        if (iIdx !== itemIndex) return itm;

        if (field === "price") {
          // remove non-digits
          const onlyNums = val.replace(/[^\d]/g, "");
          const parsed = parseInt(onlyNums, 10) || 0;
          return { ...itm, price: parsed };
        } else if (field === "name") {
          return { ...itm, name: val };
        }
        return itm;
      });
      return { ...cat, items: newItems };
    });

    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: updatedCats },
    };
    setCustomisationForItem(updated);
    setHasChanges(true);
  };

  // For debugging / JSON view
  const handleViewJSON = () => {
    console.log("--- MENU ITEMS ---");
    console.log(JSON.stringify(menuItems, null, 2));
    console.log("--- CUSTOMISATIONS ---");
    console.log(JSON.stringify(customisations, null, 2));
    toast("Check console for JSON data!");
  };

  /* ------------------------------------------------------------------
     8) Render
  */
  return (
    <div className=" bg-[#F1F1F1] relative">
      <div className="flex-1 flex flex-col">
        <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {restaurantName} Dunkin Donuts
            </h1>
            <p className="text-sm text-gray-500">Menu Management</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => addNewRow()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Item
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="border-b border-gray-200  sticky top-0 z-10 overflow-x-auto">
          <div className="px-6 py-3 flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategory("All")}
              className={` px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === "All"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              ALL
            </button>
            {[
              ...new Set(
                menuItems.map((item) => item.category || "Uncategorized")
              ),
            ]
              .sort()
              .map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? "bg-red-600 text-white"
                      : "from-gray-50 to-red-50 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {category || "Uncategorized"}
                </button>
              ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-orange-50 rounded-lg p-6 mb-4">
                <p className="text-gray-600 mb-4">
                  Start by adding your first menu item
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {(selectedCategory === "All"
                ? menuItems
                : groupedItems[selectedCategory] || []
              ).map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    selectedItem?.id === item.id ? "ring-2 ring-red-600" : ""
                  }`}
                >
                  <div className="flex items-start h-[130px] w-full">
                    <div className="rounded-lg w-[30%]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="rounded-lg w-full h-full"
                        />
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center bg-gray-300 rounded-lg">
                          <ImageIcon className="w-24 h-24 text-gray-100" />
                        </div>
                      )}
                    </div>
                    <div className="ml-2 w-[70%]">
                      <h3 className="font-[900] text-gray-900">
                        {item.name || "New Item"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-[800] text-[#da3642] text-lg">
                      {item.price} AED
                    </div>
                    <div className="bg-gray-100 relative">
                      {!item.available && (
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className=" px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {item.category || "Uncategorized"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for Item Details */}
      {selectedItem ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-white rounded-xl shadow-sm">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center relative">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Edit Item
                  </h2>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleDeleteIconClick(selectedItem.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {hasChanges &&
                    (selectedItem?.isNew ? (
                      <button
                        onClick={handleAddNewItemToServer}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 flex items-center transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveChanges}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 flex items-center transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </button>
                    ))}
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {orderedColumns.map((key) => (
                    <div
                      key={key}
                      className={
                        key === "description" || key === "name"
                          ? "col-span-2"
                          : ""
                      }
                    >
                      <label className="block mb-2 text-sm font-medium text-gray-700 capitalize">
                        {key}
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      {/* Enhanced form controls with validation feedback */}
                      {key === "image" ? (
                        <div
                          className={`space-y-2 ${
                            invalidFields.includes(key)
                              ? "ring-2 ring-red-500 rounded-lg"
                              : ""
                          }`}
                        >
                          <ImageUploader
                            currentImage={selectedItem.image}
                            onImageUpdate={(newUrl) =>
                              handleFieldEdit(selectedItem.id, "image", newUrl)
                            }
                            restaurantId={restaurantId}
                            itemId={selectedItem.id}
                            required
                          />
                        </div>
                      ) : key === "available" ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={selectedItem[key] || false}
                            onChange={(e) =>
                              handleFieldEdit(
                                selectedItem.id,
                                key,
                                e.target.checked
                              )
                            }
                            required
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      ) : key === "caffeineLevel" ? (
                        <select
                          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors
                          ${
                            invalidFields.includes(key)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={selectedItem[key] || "none"}
                          onChange={(e) =>
                            handleFieldEdit(
                              selectedItem.id,
                              key,
                              e.target.value
                            )
                          }
                          required
                        >
                          <option value="">Select caffeine level</option>
                          <option value="none">None</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : key === "dietaryPreference" ? (
                        <select
                          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors
                          ${
                            invalidFields.includes(key)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          multiple
                          value={
                            Array.isArray(selectedItem[key])
                              ? selectedItem[key]
                              : []
                          }
                          onChange={(e) => {
                            const selectedOptions = Array.from(
                              e.target.selectedOptions
                            ).map((opt) => opt.value);
                            handleFieldEdit(
                              selectedItem.id,
                              key,
                              selectedOptions
                            );
                          }}
                          required
                        >
                          <option value="veg">Vegetarian</option>
                          <option value="vegan">Vegan</option>
                          <option value="non-veg">Non-Vegetarian</option>
                        </select>
                      ) : (
                        <input
                          type={key === "price" ? "number" : "text"}
                          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors
                          ${
                            invalidFields.includes(key)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={selectedItem[key]}
                          onChange={(e) =>
                            handleFieldEdit(
                              selectedItem.id,
                              key,
                              e.target.value
                            )
                          }
                          disabled={key === "id"}
                          required={key !== "id"}
                          placeholder={`Enter ${key}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Customizations Section */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Customizations
                  </h3>
                  <div className="space-y-4">
                    {customisations
                      .find((c) => c.id === selectedItem.id)
                      ?.customisation.categories.map((category, index) => (
                        <div
                          key={index}
                          className="bg-white p-6 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <input
                              type="text"
                              className="text-lg font-medium bg-transparent border-b border-gray-300 focus:border-red-600 px-2 py-1"
                              value={category.categoryName}
                              onChange={(e) =>
                                handleCategoryFieldChange(
                                  selectedItem.id,
                                  index,
                                  "categoryName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                            <label>Min Qty</label>
                            <input
                              type="text"
                              className="border rounded px-2 py-1 w-16"
                              value={category.minQuantity}
                              onChange={(e) =>
                                handleCategoryFieldChange(
                                  selectedItem.id,
                                  index,
                                  "minQuantity",
                                  e.target.value
                                )
                              }
                            />
                            <label>Max Qty</label>
                            <input
                              type="text"
                              className="border rounded px-2 py-1 w-16"
                              value={category.maxQuantity}
                              onChange={(e) =>
                                handleCategoryFieldChange(
                                  selectedItem.id,
                                  index,
                                  "maxQuantity",
                                  e.target.value
                                )
                              }
                            />
                            <button
                              onClick={() =>
                                removeCategory(selectedItem.id, index)
                              }
                              className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Category items table */}
                          <table className="w-full">
                            <thead>
                              <tr>
                                <th className="text-left pb-2 text-gray-600">
                                  Name
                                </th>
                                <th className="text-left pb-2 text-gray-600">
                                  Price
                                </th>
                                <th className="text-right pb-2 text-gray-600">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {category.items.map((item, itemIndex) => (
                                <tr key={itemIndex}>
                                  <td className="py-2">
                                    <input
                                      type="text"
                                      className="w-full p-2 border border-gray-300 rounded-lg"
                                      value={item.name}
                                      onChange={(e) =>
                                        editItemField(
                                          selectedItem.id,
                                          index,
                                          itemIndex,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="py-2">
                                    <input
                                      type="number"
                                      className="w-24 p-2 border border-gray-300 rounded-lg"
                                      value={item.price}
                                      onChange={(e) =>
                                        editItemField(
                                          selectedItem.id,
                                          index,
                                          itemIndex,
                                          "price",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="py-2 text-right">
                                    <button
                                      onClick={() =>
                                        removeItem(
                                          selectedItem.id,
                                          index,
                                          itemIndex
                                        )
                                      }
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <button
                            onClick={() => addNewItem(selectedItem.id, index)}
                            className="mt-4 text-red-600 hover:text-red-700 flex items-center"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Item
                          </button>
                        </div>
                      ))}

                    <button
                      onClick={() => addNewCategory(selectedItem.id)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-red-600 hover:text-red-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 mx-auto mb-2" />
                      Add New Category
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {confirmDeleteItemId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative bg-white rounded-xl shadow-lg p-6 w-[400px] max-w-lg mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this item? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setConfirmDeleteItemId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={confirmDeleteItem}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
