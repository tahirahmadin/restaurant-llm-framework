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
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Enhanced */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{restaurantName}</h1>
              <p className="text-sm text-gray-500 mt-1">Menu Management</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
  
          <div className="overflow-y-auto flex-1">
            {Object.keys(groupedItems).length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-orange-50 rounded-lg p-6 mb-4">
                  <p className="text-gray-600 mb-4">Start by adding your first menu item</p>
                  <button
                    onClick={() => addNewRow()}
                    className="px-4 py-2 bg-[#f15927] text-white rounded-lg hover:bg-[#e54816] transition-colors flex items-center mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full p-4 flex items-center justify-between hover:bg-orange-50 transition-colors rounded-lg"
                    >
                      <span className="font-medium text-gray-700">{category || 'Uncategorized'}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                          expandedCategories[category] ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
  
                    {expandedCategories[category] && (
                      <div className="pl-4">
                        {items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full p-3 text-left rounded-lg transition-colors ${
                              selectedItem?.id === item.id 
                                ? 'bg-[#f15927] text-white' 
                                : 'hover:bg-orange-50 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="flex-1">{item.name || 'New Item'}</span>
                              {!item.available && (
                                <span className="ml-2 text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                                  Unavailable
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
  
            <button
              onClick={() => addNewRow()}
              className="w-full p-4 text-[#f15927] hover:bg-orange-50 flex items-center justify-center transition-colors mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Item
            </button>
          </div>
        </div>
  
        {/* Main Content Area - Enhanced */}
        {selectedItem ? (
          <div className={`flex-1 overflow-y-auto bg-gray-50 ${confirmDeleteItemId ? 'blur-sm' : ''}`}>
            <div className="max-w-4xl mx-auto py-6">
              <div className="bg-white rounded-xl shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Edit Item</h2>
                    <p className="text-sm text-gray-500 mt-1">ID: {selectedItem.id}</p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleDeleteIconClick(selectedItem.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {hasChanges && (
                      <button
                        onClick={handleSaveChanges}
                        className="px-4 py-2 bg-[#f15927] text-white rounded-lg hover:bg-[#e54816] flex items-center transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </button>
                    )}
                  </div>
                </div>
  
                {/* Form Fields */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    {orderedColumns.map(key => (
                      <div key={key} className={key === 'description' ? 'col-span-2' : ''}>
                        <label className="block mb-2 text-sm font-medium text-gray-700 capitalize">
                          {key}
                        </label>
                        
                        {/* Enhanced form controls */}
                        {key === 'image' ? (
                          <div className="space-y-2">
                            <ImageUploader
                              currentImage={selectedItem.image}
                              onImageUpdate={(newUrl) => handleFieldEdit(selectedItem.id, 'image', newUrl)}
                              restaurantId={restaurantId}
                              itemId={selectedItem.id}
                            />
                          </div>
                        ) : key === 'available' ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={selectedItem[key] || false}
                              onChange={e => handleFieldEdit(selectedItem.id, key, e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:bg-[#f15927] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                          </label>
                        ) : key === 'caffeineLevel' ? (
                          <select
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                            value={selectedItem[key] || 'none'}
                            onChange={e => handleFieldEdit(selectedItem.id, key, e.target.value)}
                          >
                            <option value="none">None</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        ) : key === 'dietaryPreference' ? (
                          <select
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent"
                            multiple
                            value={Array.isArray(selectedItem[key]) ? selectedItem[key] : []}
                            onChange={e => {
                              const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
                              handleFieldEdit(selectedItem.id, key, selectedOptions);
                            }}
                          >
                            <option value="veg">Vegetarian</option>
                            <option value="vegan">Vegan</option>
                            <option value="non-veg">Non-Vegetarian</option>
                          </select>
                        ) : (
                          <input
                            type={key === 'price' ? 'number' : 'text'}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15927] focus:border-transparent transition-colors"
                            value={selectedItem[key]}
                            onChange={e => handleFieldEdit(selectedItem.id, key, e.target.value)}
                            disabled={key === 'id'}
                          />
                        )}
                      </div>
                    ))}
                  </div>
  
                  {/* Customizations Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Customizations</h3>
                    <div className="space-y-4">
                      {customisations
                        .find(c => c.id === selectedItem.id)
                        ?.customisation.categories.map((category, index) => (
                          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                              <input
                                type="text"
                                className="text-lg font-medium bg-transparent border-b border-gray-300 focus:border-[#f15927] px-2 py-1"
                                value={category.categoryName}
                                onChange={e => handleCategoryFieldChange(selectedItem.id, index, 'categoryName', e.target.value)}
                              />
                              <button
                                onClick={() => removeCategory(selectedItem.id, index)}
                                className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Category items table */}
                            <table className="w-full">
                              <thead>
                                <tr>
                                  <th className="text-left pb-2 text-gray-600">Name</th>
                                  <th className="text-left pb-2 text-gray-600">Price</th>
                                  <th className="text-right pb-2 text-gray-600">Actions</th>
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
                                        onChange={e => editItemField(selectedItem.id, index, itemIndex, 'name', e.target.value)}
                                      />
                                    </td>
                                    <td className="py-2">
                                      <input
                                        type="number"
                                        className="w-24 p-2 border border-gray-300 rounded-lg"
                                        value={item.price}
                                        onChange={e => editItemField(selectedItem.id, index, itemIndex, 'price', e.target.value)}
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <button
                                        onClick={() => removeItem(selectedItem.id, index, itemIndex)}
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
                              className="mt-4 text-[#f15927] hover:text-[#e54816] flex items-center"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Item
                            </button>
                          </div>
                      ))}
                      
                      <button
                        onClick={() => addNewCategory(selectedItem.id)}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#f15927] hover:text-[#f15927] transition-colors"
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
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <ChevronRight className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500">Select an item to edit or add a new item</p>
            </div>
          </div>
        )}
  
        {/* Delete Confirmation Modal */}
        {confirmDeleteItemId && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white rounded-xl shadow-lg p-6 w-[400px] max-w-lg mx-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Deletion</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
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