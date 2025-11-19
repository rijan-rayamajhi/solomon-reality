const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generateId, getTimestamp } = require('../utils/helpers');

/**
 * Get all amenities
 */
router.get('/', async (req, res) => {
  try {
    const amenities = await all(
      'SELECT * FROM amenities ORDER BY name ASC'
    );
    res.json({ amenities });
  } catch (error) {
    console.error('Get amenities error:', error);
    res.status(500).json({ error: 'Failed to fetch amenities' });
  }
});

/**
 * Create new amenity (admin only)
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Amenity name is required' });
    }

    // Check if amenity already exists
    const existing = await get(
      'SELECT * FROM amenities WHERE LOWER(name) = LOWER(?)',
      [name.trim()]
    );

    if (existing) {
      return res.status(400).json({ error: 'Amenity already exists' });
    }

    const id = generateId();
    const timestamp = getTimestamp();

    await run(
      'INSERT INTO amenities (id, name, category, created_at) VALUES (?, ?, ?, ?)',
      [id, name.trim(), category || null, timestamp]
    );

    const amenity = await get('SELECT * FROM amenities WHERE id = ?', [id]);

    res.status(201).json({
      message: 'Amenity created successfully',
      amenity
    });
  } catch (error) {
    console.error('Create amenity error:', error);
    res.status(500).json({ error: 'Failed to create amenity' });
  }
});

/**
 * Update amenity (admin only)
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Amenity name is required' });
    }

    // Check if amenity exists
    const existing = await get('SELECT * FROM amenities WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Amenity not found' });
    }

    // Check if another amenity with same name exists
    const duplicate = await get(
      'SELECT * FROM amenities WHERE LOWER(name) = LOWER(?) AND id != ?',
      [name.trim(), id]
    );

    if (duplicate) {
      return res.status(400).json({ error: 'Amenity name already exists' });
    }

    await run(
      'UPDATE amenities SET name = ?, category = ?, updated_at = ? WHERE id = ?',
      [name.trim(), category || null, getTimestamp(), id]
    );

    const amenity = await get('SELECT * FROM amenities WHERE id = ?', [id]);

    res.json({
      message: 'Amenity updated successfully',
      amenity
    });
  } catch (error) {
    console.error('Update amenity error:', error);
    res.status(500).json({ error: 'Failed to update amenity' });
  }
});

/**
 * Delete amenity (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if amenity exists
    const existing = await get('SELECT * FROM amenities WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Amenity not found' });
    }

    await run('DELETE FROM amenities WHERE id = ?', [id]);

    res.json({ message: 'Amenity deleted successfully' });
  } catch (error) {
    console.error('Delete amenity error:', error);
    res.status(500).json({ error: 'Failed to delete amenity' });
  }
});

module.exports = router;

