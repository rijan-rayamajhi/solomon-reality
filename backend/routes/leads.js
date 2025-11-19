const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateLead } = require('../middleware/validators');
const { leadLimiter } = require('../middleware/security');
const { generateId, getTimestamp, paginate, generateCSV } = require('../utils/helpers');

/**
 * Create new lead/inquiry
 */
router.post('/', leadLimiter, validateLead, async (req, res) => {
  try {
    const { name, email, phone, property_id, message } = req.body;
    const leadId = generateId();
    const timestamp = getTimestamp();

    await run(
      `INSERT INTO leads (id, user_id, property_id, name, email, phone, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [leadId, req.user?.id || null, property_id || null, name, email, phone, message || null, timestamp]
    );

    // Update analytics if property_id exists
    if (property_id) {
      await run(
        `UPDATE analytics SET inquiries = inquiries + 1, updated_at = ? WHERE property_id = ?`,
        [timestamp, property_id]
      );
    }

    // Get WhatsApp number from environment variable
    const whatsappNumber = process.env.WHATSAPP_NUMBER || '';
    
    res.status(201).json({
      message: 'Inquiry submitted successfully',
      lead: {
        id: leadId,
        name,
        email,
        phone,
        message: message || null
      },
      whatsappNumber: whatsappNumber
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

/**
 * Get all leads (admin only, paginated)
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const { offset, limit: limitNum } = paginate(page, limit);

    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await get(countQuery, params);
    const total = countResult.total;

    // Get leads
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const leads = await all(query, params);

    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

/**
 * Get lead by ID (admin only)
 */
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await get('SELECT * FROM leads WHERE id = ?', [id]);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

/**
 * Update lead status (admin only)
 */
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Contacted', 'Converted', 'Lost'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const lead = await get('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await run(
      'UPDATE leads SET status = ?, updated_at = ? WHERE id = ?',
      [status, getTimestamp(), id]
    );

    // Update analytics if converted
    if (status === 'Converted' && lead.property_id) {
      await run(
        `UPDATE analytics SET conversions = conversions + 1, updated_at = ? WHERE property_id = ?`,
        [getTimestamp(), lead.property_id]
      );
    }

    const updatedLead = await get('SELECT * FROM leads WHERE id = ?', [id]);

    res.json({
      message: 'Lead status updated successfully',
      lead: updatedLead
    });
  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

/**
 * Delete lead (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await get('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await run('DELETE FROM leads WHERE id = ?', [id]);

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

/**
 * Export leads to CSV (admin only)
 */
router.get('/export/csv', authenticate, requireAdmin, async (req, res) => {
  try {
    const leads = await all('SELECT * FROM leads ORDER BY created_at DESC');

    const headers = ['id', 'name', 'email', 'phone', 'message', 'status', 'property_id', 'created_at'];
    const csv = generateCSV(leads, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export leads error:', error);
    res.status(500).json({ error: 'Failed to export leads' });
  }
});

module.exports = router;

