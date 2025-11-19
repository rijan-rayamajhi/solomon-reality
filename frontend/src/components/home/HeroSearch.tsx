'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '@/store/searchStore';
import { locationsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// Property type options
const RESIDENTIAL_TYPES = [
  'Apartment',
  'Land',
  'Villa',
  'Builder Floor',
  'Farm House',
  'Studio Apartment',
];

const COMMERCIAL_TYPES = [
  'Ready to Move Offices',
  'Bare Shell Offices',
  'Shops & Retail',
  'Commercial/Inst Land',
  'Agricultural/Farm Land',
  'Industrial Land/Plots',
  'Warehouse',
  'Cold Storage',
  'Factory & Manufacturing',
  'Hotel/Resorts',
  'Others',
];

const AREA_UNITS = ['sq.ft', 'sq.yd', 'sq.m', 'acres', 'marla', 'cents'];
const CONSTRUCTION_STATUS = ['New Launch', 'Under Construction', 'Ready to Move'];
const INVESTMENT_TYPES = ['Assured Returns', 'Rental Yield', 'Lease Guarantee', 'ROI'];
const AVAILABLE_FROM = ['Immediately', '1 Month', '3 Months', 'After 3 Months'];
const AVAILABLE_FOR = ['Family', 'Single Men', 'Single Women', 'Company Lease'];
const AGE_OPTIONS = ['0-1 years', '1-5 years', '5-10 years', '10+ years', '20+ years'];
const FLOOR_PREFERENCE = ['Basement', 'Ground', 'Terrace', '1st+'];
const BHK_OPTIONS = ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '6 BHK', '7 BHK', '8 BHK', '9+ BHK'];
const BATHROOM_OPTIONS = ['1', '2', '3', '4', '5+'];
const CABIN_OPTIONS = ['1', '2', '3', '4', '5+'];
const SITUATED_IN = ['Market', 'Retail Complex', 'Mall', 'Residential/Commercial Project'];
const BUSINESS_TYPES = ['Clothes', 'Jewellery', 'Clinic', 'Bakery', 'Restaurant', 'Electronics', 'Grocery', 'Others'];

// Amenities
const COMMON_AMENITIES = [
  'Lift', 'Vaastu Compliant', 'Security Personnel', 'Power Backup', 'Parking',
  'Gym', 'Club House', 'Park', 'Swimming Pool', 'Gas Pipeline',
  'Fire Hydrant', 'Fire Sprinkler', 'Fire NOC',
];

const RESIDENTIAL_AMENITIES = [
  ...COMMON_AMENITIES,
  'AC Room', 'Pet Friendly', 'Wheelchair Friendly', 'Wi-Fi',
  'Laundry Available', 'Food Service',
];

const COMMERCIAL_AMENITIES = COMMON_AMENITIES;

const SHOP_AMENITIES = [
  ...COMMON_AMENITIES,
  'Near Bank', 'ATM', 'Waste Disposal', 'DG Availability', 'Wheelchair Access',
];

export function HeroSearch() {
  const router = useRouter();
  const { setFilter, clearFilters } = useSearchStore();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  
  // Main state
  const [purpose, setPurpose] = useState<'Buy' | 'Rent' | 'Lease'>('Buy');
  const [category, setCategory] = useState<'Residential' | 'Commercial'>('Residential');
  const [subtype, setSubtype] = useState<string>('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Location
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ city: string; locality?: string; state?: string } | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  // Price/Area
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [areaRange, setAreaRange] = useState({ min: '', unit: 'sq.ft', max: '' });
  
  // Residential filters
  const [bhk, setBhk] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<string>('');
  const [furnishing, setFurnishing] = useState<'Furnished' | 'Semi-Furnished' | 'Unfurnished' | ''>('');
  const [availableFor, setAvailableFor] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState<string>('');
  
  // Commercial filters
  const [constructionStatus, setConstructionStatus] = useState<string>('');
  const [investmentType, setInvestmentType] = useState<string[]>([]);
  const [powerCapacity, setPowerCapacity] = useState<string>('');
  
  // Office specific
  const [meetingRooms, setMeetingRooms] = useState(false);
  const [pantry, setPantry] = useState(false);
  const [conferenceRoom, setConferenceRoom] = useState(false);
  const [cabins, setCabins] = useState<string>('');
  const [washrooms, setWashrooms] = useState<string>('');
  const [floorPreference, setFloorPreference] = useState<string>('');
  const [locatedOn, setLocatedOn] = useState<string>('');
  const [officeSpread, setOfficeSpread] = useState<string>('');
  
  // Shop specific
  const [situatedIn, setSituatedIn] = useState<string>('');
  const [businessType, setBusinessType] = useState<string[]>([]);
  
  // Common filters
  const [amenities, setAmenities] = useState<string[]>([]);
  const [ageOfProperty, setAgeOfProperty] = useState<string>('');
  const [reraApproved, setReraApproved] = useState(false);
  const [facing, setFacing] = useState<string>('');
  const [parking, setParking] = useState<string>('');

  // Location autocomplete
  const { data: locationSuggestions } = useQuery({
    queryKey: ['locations', locationInput],
    queryFn: async () => {
      if (locationInput.length < 2) return { locations: [] };
      const response = await locationsApi.search(locationInput);
      return response.data;
    },
    enabled: locationInput.length >= 2 && showLocationDropdown,
    staleTime: 5 * 60 * 1000,
  });

  // Check if search button should be enabled
  const isSearchEnabled = subtype && selectedLocation;

  // Reset filters when category changes
  useEffect(() => {
    if (category === 'Commercial') {
      setBhk('');
      setBathrooms('');
      setFurnishing('');
      setAvailableFor([]);
      setAvailableFrom('');
      setSubtype('');
    } else {
      setConstructionStatus('');
      setInvestmentType([]);
      setPowerCapacity('');
      setMeetingRooms(false);
      setPantry(false);
      setConferenceRoom(false);
      setCabins('');
      setWashrooms('');
      setSituatedIn('');
      setBusinessType([]);
      setSubtype('');
    }
  }, [category]);

  // Reset subtype-specific filters when subtype changes
  useEffect(() => {
    if (category === 'Commercial') {
      const isOffice = subtype?.includes('Office');
      const isShop = subtype?.includes('Shop') || subtype?.includes('Retail');
      
      if (!isOffice) {
        setMeetingRooms(false);
        setPantry(false);
        setConferenceRoom(false);
        setCabins('');
        setWashrooms('');
        setFloorPreference('');
        setLocatedOn('');
        setOfficeSpread('');
      }
      if (!isShop) {
        setSituatedIn('');
        setBusinessType([]);
      }
    }
  }, [subtype, category]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isSearchEnabled && !showMoreFilters) {
        handleSearch();
      } else if (e.key === 'Escape' && showMoreFilters) {
        setShowMoreFilters(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchEnabled, showMoreFilters]);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: { city: string; locality?: string; state?: string; display: string }) => {
    setSelectedLocation({ city: location.city, locality: location.locality, state: location.state });
    setLocationInput(location.display);
    setShowLocationDropdown(false);
  };

  const handleSearch = () => {
    if (!isSearchEnabled) return;

    // Set all filters in the store
    setFilter('purpose', purpose);
    setFilter('category', category);
    if (subtype) setFilter('subtype', subtype);
    
    // Location
    if (selectedLocation) {
      if (selectedLocation.locality) setFilter('locality', selectedLocation.locality);
      setFilter('city', selectedLocation.city);
      if (selectedLocation.state) setFilter('state', selectedLocation.state);
    }
    
    // Price range
    if (priceRange.min) setFilter('minPrice', Number(priceRange.min));
    if (priceRange.max) setFilter('maxPrice', Number(priceRange.max));
    
    // Area range
    if (areaRange.min) setFilter('minArea', Number(areaRange.min));
    if (areaRange.max) setFilter('maxArea', Number(areaRange.max));
    
    // Residential filters
    if (category === 'Residential') {
      if (bhk) setFilter('bhk', bhk);
      if (bathrooms) setFilter('bathrooms', Number(bathrooms));
      if (furnishing) setFilter('furnishing', furnishing);
      if (availableFor.length > 0) setFilter('availableFor', availableFor);
      if (availableFrom) setFilter('availableFrom', availableFrom);
    }
    
    // Commercial filters
    if (category === 'Commercial') {
      if (constructionStatus) setFilter('possessionStatus', constructionStatus);
      if (investmentType.length > 0) setFilter('investmentType', investmentType);
      if (powerCapacity) setFilter('powerCapacity', powerCapacity);
    }
    
    // Office specific
    const isOffice = category === 'Commercial' && (subtype?.includes('Office'));
    if (isOffice) {
      if (meetingRooms) setFilter('meetingRooms', true);
      if (pantry) setFilter('pantry', true);
      if (conferenceRoom) setFilter('conferenceRoom', true);
      if (cabins) setFilter('cabins', Number(cabins));
      if (washrooms) setFilter('washrooms', Number(washrooms));
      if (floorPreference) setFilter('floorPreference', floorPreference);
      if (locatedOn) setFilter('locatedOn', locatedOn);
      if (officeSpread) setFilter('officeSpread', officeSpread);
    }
    
    // Shop specific
    const isShop = category === 'Commercial' && (subtype?.includes('Shop') || subtype?.includes('Retail'));
    if (isShop) {
      if (situatedIn) setFilter('situatedIn', situatedIn);
      if (businessType.length > 0) setFilter('businessType', businessType);
    }
    
    // Common filters
    if (amenities.length > 0) setFilter('amenities', amenities);
    if (ageOfProperty) setFilter('ageOfProperty', ageOfProperty);
    if (reraApproved) setFilter('reraApproved', true);
    if (facing) setFilter('facing', facing);
    if (parking) setFilter('parking', parking);
    
    // Navigate to properties page
    router.push('/properties');
  };

  const handleClearFilters = () => {
    setPurpose('Buy');
    setCategory('Residential');
    setSubtype('');
    setLocationInput('');
    setSelectedLocation(null);
    setPriceRange({ min: '', max: '' });
    setAreaRange({ min: '', unit: 'sq.ft', max: '' });
    setBhk('');
    setBathrooms('');
    setFurnishing('');
    setAvailableFor([]);
    setAvailableFrom('');
    setConstructionStatus('');
    setInvestmentType([]);
    setPowerCapacity('');
    setMeetingRooms(false);
    setPantry(false);
    setConferenceRoom(false);
    setCabins('');
    setWashrooms('');
    setFloorPreference('');
    setLocatedOn('');
    setOfficeSpread('');
    setSituatedIn('');
    setBusinessType([]);
    setAmenities([]);
    setAgeOfProperty('');
    setReraApproved(false);
    setFacing('');
    setParking('');
    clearFilters();
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleAvailableFor = (value: string) => {
    setAvailableFor(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const toggleInvestmentType = (value: string) => {
    setInvestmentType(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const toggleBusinessType = (value: string) => {
    setBusinessType(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const getAmenitiesList = () => {
    if (category === 'Residential') return RESIDENTIAL_AMENITIES;
    const isShop = category === 'Commercial' && (subtype?.includes('Shop') || subtype?.includes('Retail'));
    if (isShop) return SHOP_AMENITIES;
    return COMMERCIAL_AMENITIES;
  };

  const isOffice = category === 'Commercial' && (subtype?.includes('Office'));
  const isShop = category === 'Commercial' && (subtype?.includes('Shop') || subtype?.includes('Retail'));

  // More Filters Content Component
  const MoreFiltersContent = () => (
    <div className="space-y-6 pt-6 border-t border-border">
      {/* Price & Area Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            {purpose === 'Rent' ? 'Rent (₹/month)' : purpose === 'Lease' ? 'Lease (₹/month)' : 'Price (₹)'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              placeholder="Min"
              className="input-elegant"
            />
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              placeholder="Max"
              className="input-elegant"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Area Range</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={areaRange.min}
              onChange={(e) => setAreaRange(prev => ({ ...prev, min: e.target.value }))}
              placeholder="Min"
              className="input-elegant"
            />
            <input
              type="number"
              value={areaRange.max}
              onChange={(e) => setAreaRange(prev => ({ ...prev, max: e.target.value }))}
              placeholder="Max"
              className="input-elegant"
            />
            <select
              value={areaRange.unit}
              onChange={(e) => setAreaRange(prev => ({ ...prev, unit: e.target.value }))}
              className="input-elegant"
            >
              {AREA_UNITS.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Residential Specific Filters */}
      <AnimatePresence>
        {category === 'Residential' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-accent-primary">Residential Filters</h3>
            
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Bedrooms (BHK)</label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value)}
                  className="input-elegant w-full"
                >
                  <option value="">All</option>
                  {BHK_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Bathrooms</label>
                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="input-elegant w-full"
                >
                  <option value="">All</option>
                  {BATHROOM_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Furnishing</label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value as any)}
                  className="input-elegant w-full"
                >
                  <option value="">All</option>
                  <option value="Furnished">Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Construction Status</label>
              <select
                value={constructionStatus}
                onChange={(e) => setConstructionStatus(e.target.value)}
                className="input-elegant w-full"
              >
                <option value="">All</option>
                {CONSTRUCTION_STATUS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Available From</label>
              <select
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="input-elegant w-full"
              >
                <option value="">All</option>
                {AVAILABLE_FROM.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Available For</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_FOR.map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableFor.includes(option)}
                      onChange={() => toggleAvailableFor(option)}
                      className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                    />
                    <span className="text-sm text-text-secondary">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Advanced */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Age of Property</label>
              <select
                value={ageOfProperty}
                onChange={(e) => setAgeOfProperty(e.target.value)}
                className="input-elegant w-full"
              >
                <option value="">All</option>
                {AGE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commercial Specific Filters */}
      <AnimatePresence>
        {category === 'Commercial' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-accent-primary">Commercial Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Construction Status</label>
                <select
                  value={constructionStatus}
                  onChange={(e) => setConstructionStatus(e.target.value)}
                  className="input-elegant w-full"
                >
                  <option value="">All</option>
                  {CONSTRUCTION_STATUS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Power Capacity</label>
                <input
                  type="text"
                  value={powerCapacity}
                  onChange={(e) => setPowerCapacity(e.target.value)}
                  placeholder="e.g., 50 kW, 100 kVA"
                  className="input-elegant w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Investment Type</label>
              <div className="flex flex-wrap gap-2">
                {INVESTMENT_TYPES.map(type => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={investmentType.includes(type)}
                      onChange={() => toggleInvestmentType(type)}
                      className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                    />
                    <span className="text-sm text-text-secondary">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Office Specific Filters */}
            {isOffice && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-md font-semibold text-accent-primary mb-4">Office Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Cabins</label>
                    <select
                      value={cabins}
                      onChange={(e) => setCabins(e.target.value)}
                      className="input-elegant w-full"
                    >
                      <option value="">All</option>
                      {CABIN_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Washrooms</label>
                    <select
                      value={washrooms}
                      onChange={(e) => setWashrooms(e.target.value)}
                      className="input-elegant w-full"
                    >
                      <option value="">All</option>
                      {BATHROOM_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white/90">Floor Preference</label>
                    <select
                      value={floorPreference}
                      onChange={(e) => setFloorPreference(e.target.value)}
                      className="input-elegant w-full"
                    >
                      <option value="">All</option>
                      {FLOOR_PREFERENCE.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Located On</label>
                    <select
                      value={locatedOn}
                      onChange={(e) => setLocatedOn(e.target.value)}
                      className="input-elegant w-full"
                    >
                      <option value="">All</option>
                      {FLOOR_PREFERENCE.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2 text-text-primary">Office Features</label>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={meetingRooms}
                        onChange={(e) => setMeetingRooms(e.target.checked)}
                        className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                      />
                      <span className="text-sm text-text-secondary">Meeting Room</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pantry}
                        onChange={(e) => setPantry(e.target.checked)}
                        className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                      />
                      <span className="text-sm text-text-secondary">Pantry</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={conferenceRoom}
                        onChange={(e) => setConferenceRoom(e.target.checked)}
                        className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                      />
                      <span className="text-sm text-text-secondary">Conference Room</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Shop Specific Filters */}
            {isShop && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-md font-semibold text-accent-primary mb-4">Shop Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Situated In</label>
                    <select
                      value={situatedIn}
                      onChange={(e) => setSituatedIn(e.target.value)}
                      className="input-elegant w-full"
                    >
                      <option value="">All</option>
                      {SITUATED_IN.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Business Type</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {BUSINESS_TYPES.map(type => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={businessType.includes(type)}
                            onChange={() => toggleBusinessType(type)}
                            className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                          />
                          <span className="text-sm text-text-secondary">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Floor Preference</label>
                    <select
                      value={floorPreference}
                      onChange={(e) => setFloorPreference(e.target.value)}
                      className="input-elegant w-full"
                    >
                      <option value="">All</option>
                      {FLOOR_PREFERENCE.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Age of Property for Commercial */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Age of Property</label>
              <select
                value={ageOfProperty}
                onChange={(e) => setAgeOfProperty(e.target.value)}
                className="input-elegant w-full"
              >
                <option value="">All</option>
                {AGE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Common Filters */}
      <div className="pt-6 border-t border-border">
        <h3 className="text-lg font-semibold text-accent-primary mb-4">Additional Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-primary">Facing</label>
            <select
              value={facing}
              onChange={(e) => setFacing(e.target.value)}
              className="input-elegant w-full"
            >
              <option value="">All</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
              <option value="North-East">North-East</option>
              <option value="North-West">North-West</option>
              <option value="South-East">South-East</option>
              <option value="South-West">South-West</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-primary">Parking</label>
            <select
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              className="input-elegant w-full"
            >
              <option value="">All</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4+">4+</option>
            </select>
          </div>
        </div>

        <label className="flex items-center space-x-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={reraApproved}
            onChange={(e) => setReraApproved(e.target.checked)}
            className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
          />
          <span className="text-sm text-text-secondary">RERA Approved</span>
        </label>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-text-primary">Amenities</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
            {getAmenitiesList().map(amenity => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                  className="w-4 h-4 text-accent-primary bg-surface border-border rounded focus:ring-2 focus:ring-accent-primary"
                />
                <span className="text-sm text-text-secondary">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-soft">
      <div className="container mx-auto px-4 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-4">
            <span className="text-gradient">Find Your</span>
            <br />
            <span className="text-text-primary">Dream Property</span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
            Discover premium residential and commercial properties across India
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="card-luxury p-6">
            {/* Top Toggles - Always Visible */}
            <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-border">
              <div className="flex space-x-2">
                {(['Buy', 'Rent', 'Lease'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPurpose(p)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      purpose === p
                        ? 'bg-accent-primary text-white shadow-soft'
                        : 'bg-surface-muted text-text-secondary hover:text-accent-primary hover:bg-surface'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex space-x-2">
                {(['Residential', 'Commercial'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      category === c
                        ? 'bg-accent-primary text-white shadow-soft'
                        : 'bg-surface-muted text-text-secondary hover:text-accent-primary hover:bg-surface'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              {/* Property Type */}
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold mb-2 text-text-primary">Property Type</label>
                <select
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  className="input-elegant w-full"
                >
                  <option value="">Select Type</option>
                  {(category === 'Residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* City / Locality Search */}
              <div className="md:col-span-7 relative">
                <label className="block text-sm font-semibold mb-2 text-text-primary">City / Locality</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value);
                      setShowLocationDropdown(e.target.value.length >= 2);
                    }}
                    onFocus={() => {
                      if (locationInput.length >= 2) setShowLocationDropdown(true);
                    }}
                    placeholder="Search city or locality..."
                    className="input-elegant w-full pl-10"
                  />
                  <AnimatePresence>
                    {showLocationDropdown && locationSuggestions?.locations && locationSuggestions.locations.length > 0 && (
                      <motion.div
                        ref={locationDropdownRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-large max-h-60 overflow-y-auto custom-scrollbar"
                      >
                        {locationSuggestions.locations.map((location: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleLocationSelect(location)}
                            className="w-full text-left px-4 py-2 hover:bg-surface-muted transition-colors text-text-secondary hover:text-text-primary"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-accent-primary" />
                              <span>{location.display}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Search Button */}
              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={!isSearchEnabled}
                  className={`btn-primary w-full flex items-center justify-center gap-2 ${
                    !isSearchEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Search size={20} />
                  Search Now
                </button>
              </div>
            </div>

            {/* More Filters Button */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="flex items-center gap-2 text-sm font-semibold text-accent-primary hover:text-accent-primary-hover transition-colors"
              >
                More Filters
                {showMoreFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <button
                onClick={handleClearFilters}
                className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* More Filters Panel */}
            <AnimatePresence>
              {showMoreFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <MoreFiltersContent />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
