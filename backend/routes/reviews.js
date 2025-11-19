const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateReview } = require('../middleware/validators');
const { generateId, getTimestamp } = require('../utils/helpers');

/**
 * Create property review
 */
router.post('/', authenticate, validateReview, async (req, res) => {
  try {
    const { property_id, rating, comment } = req.body;

    // Check if property exists
    const property = await get('SELECT * FROM properties WHERE id = ?', [property_id]);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if user already reviewed this property
    const existingReview = await get(
      'SELECT * FROM reviews WHERE property_id = ? AND user_id = ?',
      [property_id, req.user.id]
    );

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this property' });
    }

    // Get user name
    const user = await get('SELECT name FROM users WHERE id = ?', [req.user.id]);

    const reviewId = generateId();
    await run(
      `INSERT INTO reviews (id, property_id, user_id, user_name, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, property_id, req.user.id, user.name, rating, comment || null, getTimestamp()]
    );

    const review = await get('SELECT * FROM reviews WHERE id = ?', [reviewId]);

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

/**
 * Get reviews for property
 */
router.get('/property/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get approved reviews
    const reviews = await all(
      `SELECT * FROM reviews 
       WHERE property_id = ? AND is_approved = 1 
       ORDER BY created_at DESC`,
      [id]
    );

    // Calculate average rating
    const ratingStats = await get(
      `SELECT 
         AVG(rating) as average_rating,
         COUNT(*) as total_reviews,
         SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
         SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
         SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
         SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews 
       WHERE property_id = ? AND is_approved = 1`,
      [id]
    );

    res.json({
      reviews,
      stats: {
        average_rating: ratingStats.average_rating ? parseFloat(ratingStats.average_rating.toFixed(1)) : 0,
        total_reviews: ratingStats.total_reviews || 0,
        rating_breakdown: {
          5: ratingStats.five_star || 0,
          4: ratingStats.four_star || 0,
          3: ratingStats.three_star || 0,
          2: ratingStats.two_star || 0,
          1: ratingStats.one_star || 0
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * Approve review (admin only)
 */
router.put('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await get('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await run('UPDATE reviews SET is_approved = 1 WHERE id = ?', [id]);

    const updatedReview = await get('SELECT * FROM reviews WHERE id = ?', [id]);

    res.json({
      message: 'Review approved successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ error: 'Failed to approve review' });
  }
});

/**
 * Delete review (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await get('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await run('DELETE FROM reviews WHERE id = ?', [id]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;

