const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { paginate, parseJSON } = require('../utils/helpers');

/**
 * Get dashboard statistics (admin only)
 */
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    // Total users
    const totalUsers = await get('SELECT COUNT(*) as count FROM users');
    
    // Total properties
    const totalProperties = await get('SELECT COUNT(*) as count FROM properties');
    
    // Active properties
    const activeProperties = await get("SELECT COUNT(*) as count FROM properties WHERE status = 'Active'");
    
    // Total leads
    const totalLeads = await get('SELECT COUNT(*) as count FROM leads');
    
    // Pending leads
    const pendingLeads = await get("SELECT COUNT(*) as count FROM leads WHERE status = 'Pending'");
    
    // Total views
    const totalViews = await get('SELECT SUM(views) as total FROM properties');
    
    // Recent leads (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentLeads = await get(
      'SELECT COUNT(*) as count FROM leads WHERE created_at >= ?',
      [sevenDaysAgo]
    );

    // Top properties by views
    const topProperties = await all(
      'SELECT id, title, views FROM properties ORDER BY views DESC LIMIT 5'
    );

    res.json({
      stats: {
        totalUsers: totalUsers.count,
        totalProperties: totalProperties.count,
        activeProperties: activeProperties.count,
        totalLeads: totalLeads.count,
        pendingLeads: pendingLeads.count,
        totalViews: totalViews.total || 0,
        recentLeads: recentLeads.count
      },
      topProperties
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * Get all users (admin only, paginated)
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const { offset, limit: limitNum } = paginate(page, limit);

    let query = 'SELECT id, name, email, phone, role, is_active, email_verified, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT id, name, email, phone, role, is_active, email_verified, created_at', 'SELECT COUNT(*) as total');
    const countResult = await get(countQuery, params);
    const total = countResult.total;

    // Get users
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const users = await all(query, params);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Update user status (admin only)
 */
router.put('/users/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    const user = await get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await run(
      'UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?',
      [is_active ? 1 : 0, new Date().toISOString(), id]
    );

    const updatedUser = await get('SELECT id, name, email, phone, role, is_active, email_verified, created_at FROM users WHERE id = ?', [id]);

    res.json({
      message: 'User status updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * Update user role (admin only)
 */
router.put('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await run(
      'UPDATE users SET role = ?, updated_at = ? WHERE id = ?',
      [role, new Date().toISOString(), id]
    );

    const updatedUser = await get('SELECT id, name, email, phone, role, is_active, email_verified, created_at FROM users WHERE id = ?', [id]);

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * Delete user (admin only)
 */
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await run('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * Get analytics data (admin only)
 */
router.get('/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const rangeInDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      all: null
    }[dateRange] ?? 30;

    const sinceDate = rangeInDays
      ? new Date(Date.now() - rangeInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const dateFilterClause = (column) => (sinceDate ? `WHERE ${column} >= ?` : '');
    const dateParams = sinceDate ? [sinceDate] : [];

    // Views trend
    const viewsData = await all(
      `SELECT strftime('%Y-%m-%d', viewed_at) as date, COUNT(*) as count 
       FROM property_views 
       ${dateFilterClause('viewed_at')}
       GROUP BY strftime('%Y-%m-%d', viewed_at) 
       ORDER BY date ASC`,
      dateParams
    );

    // Leads trend
    const leadsData = await all(
      `SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count 
       FROM leads 
       ${dateFilterClause('created_at')}
       GROUP BY strftime('%Y-%m-%d', created_at) 
       ORDER BY date ASC`,
      dateParams
    );

    // Lead status breakdown
    const leadStatusData = await all(
      `SELECT status, COUNT(*) as count 
       FROM leads 
       GROUP BY status`
    );

    // Top properties by views
    const topPropertiesByViews = await all(
      `SELECT p.id, p.title, p.payload, a.views, a.inquiries, a.conversions 
       FROM properties p 
       JOIN analytics a ON p.id = a.property_id 
       ORDER BY a.views DESC 
       LIMIT 10`
    );

    // Location-based analytics
    const allProperties = await all('SELECT payload FROM properties WHERE status = ?', ['Active']);
    const locationStats = {};
    allProperties.forEach(prop => {
      const payload = parseJSON(prop.payload, {});
      const city = payload.location?.city || payload.city || 'Unknown';
      locationStats[city] = (locationStats[city] || 0) + 1;
    });

    res.json({
      viewsTrend: viewsData,
      leadsTrend: leadsData,
      leadStatusBreakdown: leadStatusData,
      topPropertiesByViews: topPropertiesByViews.map(p => ({
        ...p,
        payload: parseJSON(p.payload, {})
      })),
      locationStats
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * Get public settings (no auth required - for logo, etc.)
 */
router.get('/settings/public', async (req, res) => {
  try {
    const settings = await all('SELECT key, value FROM settings WHERE key IN (?, ?)', ['logo', 'companyName']);
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * Get settings (admin only - full access)
 */
router.get('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await all('SELECT key, value FROM settings');
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * Update settings (admin only)
 */
router.put('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const { logo } = req.body;
    const { generateId, getTimestamp } = require('../utils/helpers');

    if (logo !== undefined) {
      const existing = await get('SELECT * FROM settings WHERE key = ?', ['logo']);
      if (existing) {
        await run(
          'UPDATE settings SET value = ?, updated_at = ? WHERE key = ?',
          [logo, getTimestamp(), 'logo']
        );
      } else {
        await run(
          'INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)',
          [generateId(), 'logo', logo, getTimestamp()]
        );
      }
    }

    const settings = await all('SELECT key, value FROM settings');
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({
      message: 'Settings updated successfully',
      settings: settingsObj
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;

