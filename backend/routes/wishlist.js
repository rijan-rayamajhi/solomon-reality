const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateId, getTimestamp, parseJSON } = require('../utils/helpers');

/**
 * Get user's wishlist
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const wishlistItems = await all(
      `SELECT w.*, p.* 
       FROM wishlist w 
       JOIN properties p ON w.property_id = p.id 
       WHERE w.user_id = ? AND p.status = 'Active'
       ORDER BY w.added_at DESC`,
      [req.user.id]
    );

    const properties = wishlistItems.map(item => ({
      id: item.property_id,
      title: item.title,
      payload: parseJSON(item.payload, {}),
      status: item.status,
      views: item.views,
      created_at: item.created_at,
      added_at: item.added_at
    }));

    res.json({ properties });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

/**
 * Add property to wishlist
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { property_id } = req.body;

    if (!property_id) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Check if property exists
    const property = await get('SELECT * FROM properties WHERE id = ? AND status = ?', [property_id, 'Active']);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if already in wishlist
    const existing = await get('SELECT * FROM wishlist WHERE user_id = ? AND property_id = ?', [req.user.id, property_id]);
    if (existing) {
      return res.status(400).json({ error: 'Property already in wishlist' });
    }

    const wishlistId = generateId();
    await run(
      'INSERT INTO wishlist (id, user_id, property_id, added_at) VALUES (?, ?, ?, ?)',
      [wishlistId, req.user.id, property_id, getTimestamp()]
    );

    res.status(201).json({ message: 'Property added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

/**
 * Remove property from wishlist
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params; // property_id

    const wishlistItem = await get('SELECT * FROM wishlist WHERE user_id = ? AND property_id = ?', [req.user.id, id]);
    if (!wishlistItem) {
      return res.status(404).json({ error: 'Property not in wishlist' });
    }

    await run('DELETE FROM wishlist WHERE user_id = ? AND property_id = ?', [req.user.id, id]);

    res.json({ message: 'Property removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

module.exports = router;

