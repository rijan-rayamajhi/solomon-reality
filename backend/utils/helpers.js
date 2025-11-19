const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique ID
 */
function generateId() {
  return uuidv4();
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Safely parse JSON string
 */
function parseJSON(jsonString, defaultValue = null) {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Calculate pagination offset and limit
 */
function paginate(page = 1, limit = 10) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    offset
  };
}

/**
 * Generate CSV from data array
 */
function generateCSV(data, headers) {
  if (!data || data.length === 0) {
    return '';
  }

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [csvHeaders.join(',')];

  data.forEach(row => {
    const values = csvHeaders.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      // Escape commas and quotes in values
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

module.exports = {
  generateId,
  getTimestamp,
  parseJSON,
  paginate,
  generateCSV
};

