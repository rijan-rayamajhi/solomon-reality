const express = require('express');
const router = express.Router();
const { all } = require('../config/database');
const { parseJSON } = require('../utils/helpers');

/**
 * Get locations (cities/localities) for autocomplete
 */
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({ locations: [] });
    }

    // Get all active properties
    const properties = await all('SELECT payload FROM properties WHERE status = ?', ['Active']);
    
    // Extract unique cities and localities
    const locationMap = new Map();
    
    properties.forEach(prop => {
      const payload = parseJSON(prop.payload, {});
      const location = payload.location || {};
      
      if (location.city) {
        const cityKey = location.city.toLowerCase();
        if (!locationMap.has(cityKey)) {
          locationMap.set(cityKey, {
            city: location.city,
            state: location.state || '',
            locality: '',
            display: location.city + (location.state ? `, ${location.state}` : ''),
            type: 'city'
          });
        }
      }
      
      if (location.locality && location.city) {
        const localityKey = `${location.locality.toLowerCase()}-${location.city.toLowerCase()}`;
        if (!locationMap.has(localityKey)) {
          locationMap.set(localityKey, {
            city: location.city,
            state: location.state || '',
            locality: location.locality,
            display: `${location.locality}, ${location.city}` + (location.state ? `, ${location.state}` : ''),
            type: 'locality'
          });
        }
      }
    });

    // Filter by query
    const queryLower = query.toLowerCase();
    const matchingLocations = Array.from(locationMap.values())
      .filter(loc => 
        loc.city.toLowerCase().includes(queryLower) ||
        loc.locality.toLowerCase().includes(queryLower) ||
        loc.display.toLowerCase().includes(queryLower)
      )
      .slice(0, 10); // Limit to 10 results

    res.json({ locations: matchingLocations });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

module.exports = router;

