export interface LocationManager {
  email: string;
  password: string;
}

export interface LocationDetails {
  id?: string;
  name: string;
  contactNo: string;
  address: string;
  description: string;
  location: {
    longitude: number;
    latitude: number;
  };
  manager?: LocationManager;
}
