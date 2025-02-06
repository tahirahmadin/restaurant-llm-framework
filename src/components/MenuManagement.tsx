import React, { useState, useEffect } from 'react';
import { Trash2, Save, Plus, ImageIcon, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';
import { API_URL } from '../config';

/* ------------------------------------------------------------------
   1) Main MenuItem data (no built-in customizations)
   ------------------------------------------------------------------ */
interface MenuItem {
  id: number;
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
}

const emptyMenuItem: MenuItem = {
  id: 0,
  name: '',
  description: '',
  category: '',
  price: 0,
  image: '',
  spicinessLevel: 0,
  sweetnessLevel: 0,
  dietaryPreference: [],
  healthinessScore: 0,
  caffeineLevel: '',
  sufficientFor: 1,
  available: true
};

const orderedColumns = [
  'id',
  'name',
  'description',
  'category',
  'price',
  'image',
  'spicinessLevel',
  'sweetnessLevel',
  'dietaryPreference',
  'healthinessScore',
  'caffeineLevel',
  'sufficientFor',
  'available'
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
  id: number;  // matches the MenuItem's id
  customisation: {
    categories: AddOnCategory[];
  };
}

const emptyCustomisation: ItemCustomisation = {
  id: 0,
  customisation: {
    categories: []
  }
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
  onUpdate
}) => {
  // A) Menu items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  // B) Customisations
  const [customisations, setCustomisations] = useState<ItemCustomisation[]>([]);
  // C) UI state
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // We'll store the ID of the item we're about to delete (for confirmation).
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<number | null>(null);

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
  const generateNewId = (): number => {
    const existingIds = menuItems.map(m => m.id);
    return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  };

  /* ------------------------------------------------------------------
     6) CRUD for the main menu items
  */
  const addNewRow = (category = '') => {
    const newId = generateNewId();
    const newItem = { ...emptyMenuItem, id: newId, category };
    setMenuItems(prev => [...prev, newItem]);
    setSelectedItem(newItem);

    // Create a blank customization for this item
    const newCustom: ItemCustomisation = {
      ...emptyCustomisation,
      id: newId
    };
    setCustomisations(prev => [...prev, newCustom]);

    setHasChanges(true);
  };

  // Editing built-in MenuItem fields
  const handleFieldEdit = (itemId: number, field: keyof MenuItem, value: any) => {
    // For spicinessLevel, sweetnessLevel, or healthinessScore -> clamp to 0–5
    if (['spicinessLevel', 'sweetnessLevel', 'healthinessScore'].includes(field)) {
      let numericVal = Number(value);
      if (numericVal < 0) numericVal = 0;
      if (numericVal > 5) numericVal = 5;
      value = numericVal;
    }

    const updated = menuItems.map(item =>
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
  const confirmDeleteItem = () => {
    if (confirmDeleteItemId == null) return;
    const itemId = confirmDeleteItemId;

    // 1) Delete from menuItems
    const newItems = menuItems.filter(item => item.id !== itemId);
    setMenuItems(newItems);

    // 2) Remove customisations if any
    const newCustoms = customisations.filter(c => c.id !== itemId);
    setCustomisations(newCustoms);

    // 3) If that was the currently selected item, clear
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }

    // 4) Auto-save changes right away
    onUpdate(newItems, newCustoms);
    toast.success('Item deleted and changes saved!');

    // 5) Close the confirmation modal
    setConfirmDeleteItemId(null);
  };

  // If user clicks "No"
  const cancelDeleteItem = () => {
    setConfirmDeleteItemId(null);
  };

  // Manually save changes
  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`${API_URL}/api/restaurant/updateMenu/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuItems: menuItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            price: Number(item.price),
            image: item.image,
            spicinessLevel: Number(item.spicinessLevel),
            sweetnessLevel: Number(item.sweetnessLevel),
            dietaryPreference: item.dietaryPreference,
            healthinessScore: Number(item.healthinessScore),
            caffeineLevel: item.caffeineLevel,
            sufficientFor: Number(item.sufficientFor),
            available: Boolean(item.available)
          })),
          customisations: customisations
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save menu changes');
      }
  
      const data = await response.json();
      if (data.success) {
        onUpdate(menuItems, customisations);
        toast.success('Changes saved successfully!');
        setHasChanges(false);
      } else {
        throw new Error(data.error || 'Failed to save menu changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save changes');
    }
  };

  // Expand/collapse categories in the sidebar
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  /* ------------------------------------------------------------------
     7) Manage separate customisations
  */
  // Get or create the custom data for an item
  const getCustomisationById = (itemId: number): ItemCustomisation => {
    let found = customisations.find(c => c.id === itemId);
    if (!found) {
      found = { ...emptyCustomisation, id: itemId };
      setCustomisations(prev => [...prev, found!]);
    }
    return found!;
  };

  // Overwrite that custom object
  const setCustomisationForItem = (updated: ItemCustomisation) => {
    setCustomisations(prev => {
      const idx = prev.findIndex(c => c.id === updated.id);
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
        categoryName: 'New Category',
        minQuantity: 0,
        maxQuantity: 1,
        items: []
      }
    ];
    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: newCats }
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
      customisation: { categories: newCats }
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
      if (field === 'minQuantity' || field === 'maxQuantity') {
        const onlyNums = val.replace(/[^\d]/g, '');
        const parsed = parseInt(onlyNums, 10) || 0;
        return { ...cat, [field]: parsed };
      } else if (field === 'categoryName') {
        return { ...cat, categoryName: val };
      }
      return cat;
    });

    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: updatedCats }
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
            name: 'New Add-On',
            price: 0
          }
        ]
      };
    });

    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: updatedCats }
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
      customisation: { categories: updatedCats }
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

        if (field === 'price') {
          // remove non-digits
          const onlyNums = val.replace(/[^\d]/g, '');
          const parsed = parseInt(onlyNums, 10) || 0;
          return { ...itm, price: parsed };
        } else if (field === 'name') {
          return { ...itm, name: val };
        }
        return itm;
      });
      return { ...cat, items: newItems };
    });

    const updated: ItemCustomisation = {
      ...customData,
      customisation: { categories: updatedCats }
    };
    setCustomisationForItem(updated);
    setHasChanges(true);
  };

  // For debugging / JSON view
  const handleViewJSON = () => {
    console.log('--- MENU ITEMS ---');
    console.log(JSON.stringify(menuItems, null, 2));
    console.log('--- CUSTOMISATIONS ---');
    console.log(JSON.stringify(customisations, null, 2));
    toast('Check console for JSON data!');
  };

  /* ------------------------------------------------------------------
     8) Render
  */
  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="p-4 border-b flex justify-between items-center shrink-0">
          <h1 className="text-xl font-semibold">{restaurantName}</h1>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">No menu items yet</p>
              <button
                onClick={() => addNewRow()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </button>
            </div>
          ) : (
            <>
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="border-b">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">{category || 'Uncategorized'}</span>
                    <ChevronRight
                      className={`w-4 h-4 transform transition-transform ${
                        expandedCategories[category] ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {expandedCategories[category] && (
                    <div className="pl-6">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedItem?.id === item.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          {item.name || 'New Item'}
                          {!item.available && (
                            <span className="ml-2 text-red-500">(Unavailable)</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          <button
            onClick={() => addNewRow()}
            className="w-full p-4 text-blue-600 hover:bg-gray-50 flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Main Content (Edit) */}
      {selectedItem ? (
        <div className={`flex-1 overflow-y-auto ${confirmDeleteItemId ? 'blur-sm' : ''}`}>
          <div className="bg-white rounded-lg shadow m-6">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Edit Item</h2>
              <div className="flex space-x-4">
                {/* View JSON */}
                <button
                  onClick={handleViewJSON}
                  className="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 text-sm transition-colors"
                >
                  View JSON
                </button>

                {/* Delete -> triggers modal confirmation */}
                <button
                  onClick={() => handleDeleteIconClick(selectedItem.id)}
                  className="text-red-600 hover:text-red-900 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* Save changes if any */}
                {hasChanges && (
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* (A) Basic MenuItem fields */}
              <div className="grid grid-cols-2 gap-6">
                {orderedColumns.map(key => (
                  <div key={key} className={key === 'description' ? 'col-span-2' : ''}>
                    <label className="block mb-2 font-medium capitalize">{key}</label>

                    {key === 'image' ? (
                      <div className="space-y-2">
                        <ImageUploader
                          currentImage={selectedItem.image}
                          onImageUpdate={(newUrl) => handleFieldEdit(selectedItem.id, 'image', newUrl)}
                          restaurantId={Number(restaurantId)}  // Convert string restaurantId to number
                          itemId={selectedItem.id}            // Use the selected item's id
                        />
                        {/* Button to remove image */}
                        {selectedItem.image && (
                          <button
                            onClick={() => handleFieldEdit(selectedItem.id, 'image', '')}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                    ) : key === 'available' ? (
                      <input
                        type="checkbox"
                        checked={selectedItem[key]}
                        onChange={e => handleFieldEdit(selectedItem.id, key, e.target.checked)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    ) : key === 'caffeineLevel' ? (
                      <select
                        className="w-full p-2 border rounded"
                        value={selectedItem[key]}
                        onChange={e => handleFieldEdit(selectedItem.id, key, e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    ) : key === 'dietaryPreference' ? (
                      <select
                        className="w-full p-2 border rounded"
                        multiple
                        value={selectedItem[key]}
                        onChange={e => {
                          const selectedOpts = Array.from(e.target.selectedOptions).map(
                            opt => opt.value
                          );
                          handleFieldEdit(selectedItem.id, key, selectedOpts.join(','));
                        }}
                      >
                        <option value="veg">Veg</option>
                        <option value="non-veg">Non-veg</option>
                        <option value="egg">Egg</option>
                      </select>
                    ) : key === 'id' ? (
                      <input
                        type="text"
                        className="w-full p-2 border rounded bg-gray-100"
                        value={selectedItem[key]}
                        disabled
                      />
                    ) : key === 'spicinessLevel' ||
                      key === 'sweetnessLevel' ||
                      key === 'healthinessScore' ? (
                      // Use a slider from 0 to 5
                      <div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={selectedItem[key] as number}
                          onChange={e => handleFieldEdit(selectedItem.id, key, e.target.value)}
                          className="w-full cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">
                          {selectedItem[key]}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={selectedItem[key] as string | number}
                        onChange={e => handleFieldEdit(selectedItem.id, key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* (B) Customisations: each category has min/max, plus multiple items (name, price) */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Customisations</h3>
                {(() => {
                  const found = customisations.find(c => c.id === selectedItem.id);
                  const categories = found ? found.customisation.categories : [];

                  if (categories.length === 0) {
                    return <p className="text-gray-500">No customisations yet.</p>;
                  }

                  return categories.map((cat, catIndex) => (
                    <div key={catIndex} className="border p-4 mb-4 rounded shadow-sm">
                      {/* Category header with name, min, max, remove */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 space-y-2 sm:space-y-0">
                        <div className="flex-1 flex items-center space-x-2">
                          <label className="font-medium">Category Name</label>
                          <input
                            type="text"
                            className="border rounded px-2 py-1 w-44"
                            placeholder="e.g. Toppings"
                            value={cat.categoryName}
                            onChange={e =>
                              handleCategoryFieldChange(selectedItem.id, catIndex, 'categoryName', e.target.value)
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                          <label>Min Qty</label>
                          <input
                            type="text"
                            className="border rounded px-2 py-1 w-16"
                            value={cat.minQuantity}
                            onChange={e =>
                              handleCategoryFieldChange(selectedItem.id, catIndex, 'minQuantity', e.target.value)
                            }
                          />
                          <label>Max Qty</label>
                          <input
                            type="text"
                            className="border rounded px-2 py-1 w-16"
                            value={cat.maxQuantity}
                            onChange={e =>
                              handleCategoryFieldChange(selectedItem.id, catIndex, 'maxQuantity', e.target.value)
                            }
                          />
                          <button
                            onClick={() => removeCategory(selectedItem.id, catIndex)}
                            className="text-red-500 hover:text-red-700 flex items-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Table for Items (Name, Price) */}
                      <table className="w-full border text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">Price</th>
                            <th className="p-2 border">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.items.map((itm, itmIndex) => (
                            <tr key={itmIndex} className="border-b">
                              <td className="p-2 border">
                                <input
                                  type="text"
                                  className="w-full border rounded px-1 py-1"
                                  value={itm.name}
                                  onChange={e =>
                                    editItemField(
                                      selectedItem.id,
                                      catIndex,
                                      itmIndex,
                                      'name',
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td className="p-2 border">
                                <input
                                  type="text"
                                  className="w-20 border rounded px-1 py-1"
                                  value={itm.price}
                                  onChange={e =>
                                    editItemField(
                                      selectedItem.id,
                                      catIndex,
                                      itmIndex,
                                      'price',
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td className="p-2 border text-center">
                                <button
                                  onClick={() => removeItem(selectedItem.id, catIndex, itmIndex)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Add item button */}
                      <button
                        onClick={() => addNewItem(selectedItem.id, catIndex)}
                        className="mt-2 text-blue-600 hover:underline text-sm"
                      >
                        + Add Item
                      </button>
                    </div>
                  ));
                })()}

                {/* Add new Category */}
                <button
                  onClick={() => addNewCategory(selectedItem.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  + Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`flex-1 p-6 flex items-center justify-center text-gray-500 ${
            confirmDeleteItemId ? 'blur-sm' : ''
          }`}
        >
          Select an item to edit or add a new item
        </div>
      )}

      {/* Confirmation Modal (only if confirmDeleteItemId != null) */}
      {confirmDeleteItemId != null && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black opacity-50"></div>

          {/* Modal content */}
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-[300px]">
            <h2 className="text-xl font-semibold mb-4">Are you sure?</h2>
            <p className="mb-6">Do you really want to delete this item permanently?</p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                onClick={cancelDeleteItem}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={confirmDeleteItem}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
