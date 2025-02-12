// Utility function to clear all local storage except specific items
export const clearLocalStorage = () => {
  // List of keys to preserve (if any)
  const preserveKeys = ['theme', 'language'];

  // Get all keys from localStorage
  const keys = Object.keys(localStorage);

  // Remove all items except preserved ones
  keys.forEach(key => {
    if (!preserveKeys.includes(key)) {
      localStorage.removeItem(key);
    }
  });
};