const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateId, getTimestamp, parseJSON } = require('../utils/helpers');

/**
 * Get user's property drafts
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const drafts = await all(
      'SELECT * FROM property_drafts WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );

    const parsedDrafts = drafts.map(draft => ({
      ...draft,
      payload: parseJSON(draft.payload, {})
    }));

    res.json({ drafts: parsedDrafts });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

/**
 * Save property draft
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, payload } = req.body;
    const draftId = generateId();
    const timestamp = getTimestamp();

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload || {});

    await run(
      'INSERT INTO property_drafts (id, user_id, title, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [draftId, req.user.id, title || null, payloadString, timestamp, timestamp]
    );

    const draft = await get('SELECT * FROM property_drafts WHERE id = ?', [draftId]);

    res.status(201).json({
      message: 'Draft saved successfully',
      draft: {
        ...draft,
        payload: parseJSON(draft.payload, {})
      }
    });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

/**
 * Update property draft
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, payload } = req.body;

    // Check if draft exists and belongs to user
    const existing = await get('SELECT * FROM property_drafts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Draft not found' });
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

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    values.push(getTimestamp());
    values.push(id);

    await run(`UPDATE property_drafts SET ${updates.join(', ')} WHERE id = ?`, values);

    const draft = await get('SELECT * FROM property_drafts WHERE id = ?', [id]);

    res.json({
      message: 'Draft updated successfully',
      draft: {
        ...draft,
        payload: parseJSON(draft.payload, {})
      }
    });
  } catch (error) {
    console.error('Update draft error:', error);
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

/**
 * Delete property draft
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const draft = await get('SELECT * FROM property_drafts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    await run('DELETE FROM property_drafts WHERE id = ?', [id]);

    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

module.exports = router;

