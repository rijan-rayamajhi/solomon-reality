export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface Property {
  id: string;
  title: string;
  payload: PropertyPayload;
  status: 'Active' | 'Sold' | 'Rented' | 'Inactive';
  views: number;
  created_at: string;
  updated_at?: string;
}

export interface PropertyPayload {
  category: 'Residential' | 'Commercial';
  purpose: 'Buy' | 'Rent' | 'Lease';
  subtype?: string;
  price: number;
  area: number;
  areaUnit?: string;
  location: {
    city: string;
    state: string;
    locality?: string;
    address?: string;
    pincode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  description?: string;
  images?: string[];
  videos?: string[];
  floorPlan?: string;
  bhk?: string;
  bathrooms?: number;
  furnishing?: 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
  availableFor?: string[];
  availableFrom?: string;
  constructionStatus?: string;
  possessionStatus?: string;
  investmentType?: string;
  powerCapacity?: string;
  meetingRooms?: boolean;
  pantry?: boolean;
  conferenceRoom?: boolean;
  cabins?: number;
  washrooms?: number;
  floorPreference?: string;
  locatedOn?: string;
  officeSpread?: string;
  situatedIn?: string;
  businessType?: string[];
  amenities?: string[];
  features?: string[];
  reraApproved?: boolean;
  ageOfProperty?: string;
  facing?: string;
  parking?: string;
  totalFloors?: number;
  floorNumber?: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_id?: string;
  property?: Property;
  message?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  property_id: string;
  user_id: string;
  user?: User;
  rating: number;
  comment?: string;
  approved: boolean;
  created_at: string;
}

export interface SearchFilters {
  search?: string;
  category?: 'Residential' | 'Commercial';
  purpose?: 'Buy' | 'Rent' | 'Lease';
  subtype?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bhk?: string;
  bathrooms?: number;
  furnishing?: 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
  availableFor?: string[];
  availableFrom?: string;
  constructionStatus?: string;
  possessionStatus?: string;
  investmentType?: string[];
  powerCapacity?: string;
  meetingRooms?: boolean;
  pantry?: boolean;
  conferenceRoom?: boolean;
  cabins?: number;
  washrooms?: number;
  floorPreference?: string;
  locatedOn?: string;
  officeSpread?: string;
  situatedIn?: string;
  businessType?: string[];
  city?: string;
  state?: string;
  locality?: string;
  amenities?: string[];
  reraApproved?: boolean;
  ageOfProperty?: string;
  facing?: string;
  parking?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'views';
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  totalLeads: number;
  newLeads: number;
  totalUsers: number;
  totalViews: number;
  conversions: number;
  revenue?: number;
}

export interface Analytics {
  property_id: string;
  views: number;
  inquiries: number;
  conversions: number;
  updated_at: string;
}

