import type { RestaurantProfile } from "../types/restaurant";

export interface RestaurantValidation {
    name: string;
    description: string;
    contactNo: string;
    address: string;
    image: string;
    menuUploaded: boolean;
    paymentsEnabled: boolean;
  }
  
  export const validateRestaurantOnlineStatus = (profile: RestaurantProfile): { 
    isValid: boolean; 
    message: string 
  } => {
    if (!profile.name?.trim()) {
      return { isValid: false, message: "Restaurant name is required" };
    }
  
    if (!profile.description?.trim()) {
      return { isValid: false, message: "Restaurant description is required" };
    }
  
    if (!profile.contactNo?.trim()) {
      return { isValid: false, message: "Contact number is required" };
    }
  
    if (!profile.address?.trim()) {
      return { isValid: false, message: "Address is required" };
    }
  
    if (!profile.image) {
      return { isValid: false, message: "Restaurant image is required" };
    }
  
    // Check if menu is uploaded
    if (!profile.menuUploaded) {
      return { isValid: false, message: "Please upload menu before going online" };
    }
  
    if (!profile.paymentsEnabled) {
      return { isValid: false, message: "Please set up payments before going online" };
    }
  
    return { isValid: true, message: "All validations passed" };
  };