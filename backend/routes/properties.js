const express = require('express');
const router = express.Router();
const ImageKit = require('imagekit');
const { run, get, all } = require('../config/database');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateProperty } = require('../middleware/validators');
const { generateId, getTimestamp, parseJSON, paginate } = require('../utils/helpers');
require('dotenv').config();

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Delete media from ImageKit
 * @param {string[]} publicIds - Array of ImageKit file IDs
 * @returns {Promise<Array>} - Deletion results
 */
async function deleteMediaFromImageKit(publicIds = []) {
  const results = [];
  for (const id of publicIds) {
    try {
      await imagekit.deleteFile(id);
      results.push({ id, status: 'deleted' });
    } catch (err) {
      console.error('Failed to delete:', id, err.message);
      results.push({ id, status: 'failed' });
    }
  }
  return results;
}


/**
 * Get all properties (paginated, filtered by status and search filters)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      status,
      search,
      category,
      purpose,
      subtype,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      bhk,
      bathrooms,
      furnishing,
      availableFor,
      availableFrom,
      constructionStatus,
      investmentType,
      powerCapacity,
      meetingRooms,
      pantry,
      conferenceRoom,
      cabins,
      washrooms,
      floorPreference,
      locatedOn,
      officeSpread,
      situatedIn,
      businessType,
      city,
      state,
      locality,
      amenities,
      reraApproved,
      ageOfProperty,
      possessionStatus,
      facing,
      parking,
      sortBy
    } = req.query;
    
    const { offset, limit: limitNum } = paginate(page, limit);
    const userRole = req.user?.role;
    const statusFilter = userRole === 'admin' && status ? status : 'Active';

    // Build filters object
    const filters = {};
    if (search) filters.search = search;
    if (category) filters.category = category;
    if (purpose) filters.purpose = purpose;
    if (subtype) filters.subtype = subtype;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (minArea) filters.minArea = parseFloat(minArea);
    if (maxArea) filters.maxArea = parseFloat(maxArea);
    if (bhk) filters.bhk = bhk;
    if (bathrooms) filters.bathrooms = parseInt(bathrooms);
    if (furnishing) filters.furnishing = furnishing;
    if (availableFor) {
      filters.availableFor = Array.isArray(availableFor) ? availableFor : [availableFor];
    }
    if (availableFrom) filters.availableFrom = availableFrom;
    if (constructionStatus) filters.constructionStatus = constructionStatus;
    if (investmentType) {
      filters.investmentType = Array.isArray(investmentType) ? investmentType : [investmentType];
    }
    if (powerCapacity) filters.powerCapacity = powerCapacity;
    if (meetingRooms !== undefined) filters.meetingRooms = meetingRooms === 'true';
    if (pantry !== undefined) filters.pantry = pantry === 'true';
    if (conferenceRoom !== undefined) filters.conferenceRoom = conferenceRoom === 'true';
    if (cabins) filters.cabins = parseInt(cabins);
    if (washrooms) filters.washrooms = parseInt(washrooms);
    if (floorPreference) filters.floorPreference = floorPreference;
    if (locatedOn) filters.locatedOn = locatedOn;
    if (officeSpread) filters.officeSpread = officeSpread;
    if (situatedIn) filters.situatedIn = situatedIn;
    if (businessType) {
      filters.businessType = Array.isArray(businessType) ? businessType : [businessType];
    }
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (locality) filters.locality = locality;
    if (amenities) {
      filters.amenities = Array.isArray(amenities) ? amenities : [amenities];
    }
    if (reraApproved !== undefined) filters.reraApproved = reraApproved === 'true';
    if (ageOfProperty) filters.ageOfProperty = ageOfProperty;
    if (possessionStatus) filters.possessionStatus = possessionStatus;
    if (facing) filters.facing = facing;
    if (parking) filters.parking = parking;
    if (sortBy) filters.sortBy = sortBy;
    filters.status = statusFilter;

    // If filters exist, use search logic
    const hasFilters = Object.keys(filters).length > 1 || (Object.keys(filters).length === 1 && filters.status);
    
    if (hasFilters) {
      // Use search endpoint logic
      const allProperties = await all('SELECT * FROM properties WHERE status = ?', [statusFilter]);
      
      let filteredProperties = allProperties.filter(prop => {
        const payload = parseJSON(prop.payload, {});
        
        if (filters.category && payload.category !== filters.category) return false;
        if (filters.purpose && payload.purpose !== filters.purpose) return false;
        if (filters.minPrice && payload.price < filters.minPrice) return false;
        if (filters.maxPrice && payload.price > filters.maxPrice) return false;
        if (filters.minArea && payload.area < filters.minArea) return false;
        if (filters.maxArea && payload.area > filters.maxArea) return false;
        if (filters.subtype && payload.subtype !== filters.subtype) return false;
        if (filters.bhk && payload.bhk !== filters.bhk) return false;
        if (filters.bathrooms && payload.bathrooms !== filters.bathrooms) return false;
        if (filters.furnishing && payload.furnishing !== filters.furnishing) return false;
        if (filters.availableFor && Array.isArray(filters.availableFor) && filters.availableFor.length > 0) {
          const propertyAvailableFor = payload.availableFor || [];
          const hasMatch = filters.availableFor.some(af => 
            propertyAvailableFor.some(paf => paf.toLowerCase() === af.toLowerCase())
          );
          if (!hasMatch) return false;
        }
        if (filters.availableFrom && payload.availableFrom !== filters.availableFrom) return false;
        if (filters.constructionStatus && payload.constructionStatus !== filters.constructionStatus) return false;
        if (filters.investmentType && Array.isArray(filters.investmentType) && filters.investmentType.length > 0) {
          const propertyInvestmentType = payload.investmentType || '';
          const hasMatch = filters.investmentType.some(it => 
            propertyInvestmentType.toLowerCase().includes(it.toLowerCase())
          );
          if (!hasMatch) return false;
        }
        if (filters.powerCapacity && payload.powerCapacity !== filters.powerCapacity) return false;
        if (filters.meetingRooms !== undefined && payload.meetingRooms !== filters.meetingRooms) return false;
        if (filters.pantry !== undefined && payload.pantry !== filters.pantry) return false;
        if (filters.conferenceRoom !== undefined && payload.conferenceRoom !== filters.conferenceRoom) return false;
        if (filters.cabins && payload.cabins !== filters.cabins) return false;
        if (filters.washrooms && payload.bathrooms !== filters.washrooms) return false;
        if (filters.floorPreference && payload.floorPreference !== filters.floorPreference) return false;
        if (filters.locatedOn && payload.locatedOn !== filters.locatedOn) return false;
        if (filters.officeSpread && payload.officeSpread !== filters.officeSpread) return false;
        if (filters.situatedIn && payload.situatedIn !== filters.situatedIn) return false;
        if (filters.businessType && Array.isArray(filters.businessType) && filters.businessType.length > 0) {
          const propertyBusinessType = payload.businessType || '';
          const hasMatch = filters.businessType.some(bt => 
            propertyBusinessType.toLowerCase().includes(bt.toLowerCase())
          );
          if (!hasMatch) return false;
        }
        if (filters.city && payload.location?.city?.toLowerCase() !== filters.city.toLowerCase()) return false;
        if (filters.locality && payload.location?.locality?.toLowerCase() !== filters.locality.toLowerCase()) return false;
        if (filters.state && payload.location?.state?.toLowerCase() !== filters.state.toLowerCase()) return false;
        if (filters.amenities && Array.isArray(filters.amenities) && filters.amenities.length > 0) {
          const propertyAmenities = payload.amenities || [];
          const hasMatchingAmenity = filters.amenities.some(amenity => 
            propertyAmenities.some(pa => pa.toLowerCase() === amenity.toLowerCase())
          );
          if (!hasMatchingAmenity) return false;
        }
        if (filters.reraApproved !== undefined && payload.reraApproved !== filters.reraApproved) return false;
        if (filters.ageOfProperty && payload.ageOfProperty !== filters.ageOfProperty) return false;
        if (filters.possessionStatus && payload.possessionStatus !== filters.possessionStatus) return false;
        if (filters.facing && payload.facing !== filters.facing) return false;
        if (filters.parking && payload.parking !== filters.parking) return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const titleMatch = prop.title.toLowerCase().includes(searchLower);
          const descMatch = (payload.description || '').toLowerCase().includes(searchLower);
          const cityMatch = (payload.location?.city || '').toLowerCase().includes(searchLower);
          if (!titleMatch && !descMatch && !cityMatch) return false;
        }
        return true;
      });

      // Sort
      if (filters.sortBy === 'price_asc') {
        filteredProperties.sort((a, b) => {
          const aPrice = parseJSON(a.payload, {}).price || 0;
          const bPrice = parseJSON(b.payload, {}).price || 0;
          return aPrice - bPrice;
        });
      } else if (filters.sortBy === 'price_desc') {
        filteredProperties.sort((a, b) => {
          const aPrice = parseJSON(a.payload, {}).price || 0;
          const bPrice = parseJSON(b.payload, {}).price || 0;
          return bPrice - aPrice;
        });
      } else if (filters.sortBy === 'views') {
        filteredProperties.sort((a, b) => b.views - a.views);
      } else {
        filteredProperties.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      const total = filteredProperties.length;
      const paginatedProperties = filteredProperties.slice(offset, offset + limitNum);
      
      const parsedProperties = paginatedProperties.map(prop => ({
        ...prop,
        payload: parseJSON(prop.payload, {})
      }));

      return res.json({
        properties: parsedProperties,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    }

    // No filters - simple query
    let query = 'SELECT * FROM properties WHERE status = ?';
    const params = [statusFilter];

    const countResult = await get('SELECT COUNT(*) as total FROM properties WHERE status = ?', [statusFilter]);
    const total = countResult.total;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const properties = await all(query, params);

    const parsedProperties = properties.map(prop => ({
      ...prop,
      payload: parseJSON(prop.payload, {})
    }));

    res.json({
      properties: parsedProperties,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

/**
 * Get single property by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    let query = 'SELECT * FROM properties WHERE id = ?';
    const params = [id];

    // Users can only see Active properties
    if (userRole !== 'admin') {
      query += ' AND status = ?';
      params.push('Active');
    }

    const property = await get(query, params);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Increment view count
    await run('UPDATE properties SET views = views + 1 WHERE id = ?', [id]);

    // Track view
    const viewId = generateId();
    await run(
      'INSERT INTO property_views (id, property_id, user_id, viewed_at) VALUES (?, ?, ?, ?)',
      [viewId, id, req.user?.id || null, getTimestamp()]
    );

    // Update analytics
    await run(
      `INSERT INTO analytics (property_id, views, updated_at)
       VALUES (?, 1, ?)
       ON CONFLICT(property_id) DO UPDATE SET views = views + 1, updated_at = ?`,
      [id, getTimestamp(), getTimestamp()]
    );

    const parsedProperty = {
      ...property,
      payload: parseJSON(property.payload, {})
    };

    res.json({ property: parsedProperty });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

/**
 * Create new property (admin only)
 */
router.post('/', authenticate, requireAdmin, validateProperty, async (req, res) => {
  try {
    const { title, payload } = req.body;
    const propertyId = generateId();
    const timestamp = getTimestamp();

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    await run(
      'INSERT INTO properties (id, title, payload, created_at) VALUES (?, ?, ?, ?)',
      [propertyId, title, payloadString, timestamp]
    );

    // Initialize analytics
    await run(
      'INSERT INTO analytics (property_id, views, inquiries, conversions, updated_at) VALUES (?, 0, 0, 0, ?)',
      [propertyId, timestamp]
    );

    const property = await get('SELECT * FROM properties WHERE id = ?', [propertyId]);

    res.status(201).json({
      message: 'Property created successfully',
      property: {
        ...property,
        payload: parseJSON(property.payload, {})
      }
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

/**
 * Update property (admin only)
 */
router.put('/:id', authenticate, requireAdmin, validateProperty, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, payload, status } = req.body;

    // Check if property exists
    const existing = await get('SELECT * FROM properties WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (payload !== undefined) {
      updates.push('payload = ?');
      values.push(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    values.push(getTimestamp());
    values.push(id);

    await run(`UPDATE properties SET ${updates.join(', ')} WHERE id = ?`, values);

    const property = await get('SELECT * FROM properties WHERE id = ?', [id]);

    res.json({
      message: 'Property updated successfully',
      property: {
        ...property,
        payload: parseJSON(property.payload, {})
      }
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

/**
 * Delete property (admin only)
 * Also deletes associated images and videos from ImageKit
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const property = await get('SELECT * FROM properties WHERE id = ?', [id]);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Parse payload to get media URLs and fileIds
    const payload = parseJSON(property.payload, {});
    const publicIds = [];
    
    // Collect all image fileIds
    if (payload.images && Array.isArray(payload.images)) {
      payload.images.forEach(item => {
        if (typeof item === 'string') {
          // Legacy format: just URL - try to extract fileId from URL
          // For ImageKit, we'd need to query by path, but for now skip
          // Better to store fileId when uploading
        } else if (item && (item.fileId || item.public_id)) {
          publicIds.push(item.fileId || item.public_id);
        }
      });
    }
    
    // Collect all video fileIds
    if (payload.videos && Array.isArray(payload.videos)) {
      payload.videos.forEach(item => {
        if (typeof item === 'string') {
          // Legacy format: just URL - skip for now
        } else if (item && (item.fileId || item.public_id)) {
          publicIds.push(item.fileId || item.public_id);
        }
      });
    }
    
    // Collect floor plan fileId if exists
    if (payload.floorPlan) {
      if (typeof payload.floorPlan === 'object' && (payload.floorPlan.fileId || payload.floorPlan.public_id)) {
        publicIds.push(payload.floorPlan.fileId || payload.floorPlan.public_id);
      }
    }

    // Delete media from ImageKit
    const deleteResults = await deleteMediaFromImageKit(publicIds);
    const successfulDeletes = deleteResults.filter(r => r.status === 'deleted').length;
    const failedDeletes = deleteResults.filter(r => r.status === 'failed').length;

    if (failedDeletes > 0) {
      console.warn(`Failed to delete ${failedDeletes} media file(s) from ImageKit, but continuing with property deletion`);
    }

    // Delete property from database
    await run('DELETE FROM properties WHERE id = ?', [id]);

    // Also delete related analytics
    await run('DELETE FROM analytics WHERE property_id = ?', [id]).catch(err => {
      console.warn('Error deleting analytics:', err);
    });

    // Delete related views
    await run('DELETE FROM property_views WHERE property_id = ?', [id]).catch(err => {
      console.warn('Error deleting property views:', err);
    });

    // Delete related reviews
    await run('DELETE FROM reviews WHERE property_id = ?', [id]).catch(err => {
      console.warn('Error deleting reviews:', err);
    });

    // Delete from wishlists
    await run('DELETE FROM wishlist WHERE property_id = ?', [id]).catch(err => {
      console.warn('Error deleting from wishlists:', err);
    });

    res.json({ 
      message: 'Property deleted successfully',
      deletedMedia: {
        total: publicIds.length,
        successful: successfulDeletes,
        failed: failedDeletes
      }
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

/**
 * Advanced search with filters
 */
router.post('/search', optionalAuth, async (req, res) => {
  try {
    const { filters = {}, page = 1, limit = 12 } = req.body;
    const { offset, limit: limitNum } = paginate(page, limit);
    const userRole = req.user?.role;

    let query = 'SELECT * FROM properties WHERE 1=1';
    const params = [];

    // Status filter - users only see Active
    if (userRole !== 'admin') {
      query += ' AND status = ?';
      params.push('Active');
    } else if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    // Get all properties to filter in memory (for complex JSON queries)
    const allProperties = await all('SELECT * FROM properties WHERE status = ?', [userRole === 'admin' && filters.status ? filters.status : 'Active']);

    // Filter properties based on payload JSON
    let filteredProperties = allProperties.filter(prop => {
      const payload = parseJSON(prop.payload, {});

      // Category filter
      if (filters.category && payload.category !== filters.category) return false;

      // Purpose filter
      if (filters.purpose && payload.purpose !== filters.purpose) return false;

      // Price range
      if (filters.minPrice && payload.price < filters.minPrice) return false;
      if (filters.maxPrice && payload.price > filters.maxPrice) return false;

      // Area range
      if (filters.minArea && payload.area < filters.minArea) return false;
      if (filters.maxArea && payload.area > filters.maxArea) return false;

      // BHK filter
      if (filters.bhk && payload.bhk !== filters.bhk) return false;

      // Furnishing filter
      if (filters.furnishing && payload.furnishing !== filters.furnishing) return false;

      // Location filters
      if (filters.city && payload.location?.city?.toLowerCase() !== filters.city.toLowerCase()) return false;
      if (filters.locality && payload.location?.locality?.toLowerCase() !== filters.locality.toLowerCase()) return false;
      if (filters.state && payload.location?.state?.toLowerCase() !== filters.state.toLowerCase()) return false;

      // Amenities filter (at least one match)
      if (filters.amenities && Array.isArray(filters.amenities) && filters.amenities.length > 0) {
        const propertyAmenities = payload.amenities || [];
        const hasMatchingAmenity = filters.amenities.some(amenity => 
          propertyAmenities.some(pa => pa.toLowerCase() === amenity.toLowerCase())
        );
        if (!hasMatchingAmenity) return false;
      }

      // RERA filter
      if (filters.reraApproved !== undefined && payload.reraApproved !== filters.reraApproved) return false;

      // Age of property
      if (filters.ageOfProperty && payload.ageOfProperty !== filters.ageOfProperty) return false;

      // Possession status
      if (filters.possessionStatus && payload.possessionStatus !== filters.possessionStatus) return false;

      // Facing
      if (filters.facing && payload.facing !== filters.facing) return false;

      // Parking
      if (filters.parking && payload.parking !== filters.parking) return false;

      // Search text (title, description)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = prop.title.toLowerCase().includes(searchLower);
        const descMatch = (payload.description || '').toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch) return false;
      }

      return true;
    });

    // Sort
    if (filters.sortBy === 'price_asc') {
      filteredProperties.sort((a, b) => {
        const aPrice = parseJSON(a.payload, {}).price || 0;
        const bPrice = parseJSON(b.payload, {}).price || 0;
        return aPrice - bPrice;
      });
    } else if (filters.sortBy === 'price_desc') {
      filteredProperties.sort((a, b) => {
        const aPrice = parseJSON(a.payload, {}).price || 0;
        const bPrice = parseJSON(b.payload, {}).price || 0;
        return bPrice - aPrice;
      });
    } else if (filters.sortBy === 'views') {
      filteredProperties.sort((a, b) => b.views - a.views);
    } else {
      filteredProperties.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const total = filteredProperties.length;
    const paginatedProperties = filteredProperties.slice(offset, offset + limitNum);

    // Parse payload JSON
    const parsedProperties = paginatedProperties.map(prop => ({
      ...prop,
      payload: parseJSON(prop.payload, {})
    }));

    res.json({
      properties: parsedProperties,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Search properties error:', error);
    res.status(500).json({ error: 'Failed to search properties' });
  }
});

/**
 * Get similar properties
 */
router.get('/:id/similar', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    // Get the property
    const property = await get('SELECT * FROM properties WHERE id = ? AND status = ?', [id, 'Active']);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const payload = parseJSON(property.payload, {});

    // Find similar properties (same category, purpose, city)
    const similar = await all(
      `SELECT * FROM properties 
       WHERE id != ? 
       AND status = ? 
       AND payload LIKE ? 
       AND payload LIKE ? 
       AND payload LIKE ?
       ORDER BY views DESC 
       LIMIT ?`,
      [
        id,
        'Active',
        `%"category":"${payload.category}"%`,
        `%"purpose":"${payload.purpose}"%`,
        `%"city":"${payload.location?.city || ''}"%`,
        limit
      ]
    );

    const parsedSimilar = similar.map(prop => ({
      ...prop,
      payload: parseJSON(prop.payload, {})
    }));

    res.json({ properties: parsedSimilar });
  } catch (error) {
    console.error('Get similar properties error:', error);
    res.status(500).json({ error: 'Failed to fetch similar properties' });
  }
});

module.exports = router;

