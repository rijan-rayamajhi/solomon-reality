const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

/**
 * User registration validation
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone number format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

/**
 * User login validation
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Property creation/update validation
 */
const validateProperty = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('payload')
    .notEmpty().withMessage('Property payload is required')
    .custom((value) => {
      try {
        const payload = typeof value === 'string' ? JSON.parse(value) : value;
        
        // Required fields
        if (!payload.category || !['Residential', 'Commercial'].includes(payload.category)) {
          throw new Error('Category must be Residential or Commercial');
        }
        if (!payload.purpose || !['Buy', 'Rent', 'Lease'].includes(payload.purpose)) {
          throw new Error('Purpose must be Buy, Rent, or Lease');
        }
        if (!payload.subtype || typeof payload.subtype !== 'string' || payload.subtype.trim().length === 0) {
          throw new Error('Property type is required');
        }
        if (!payload.price || typeof payload.price !== 'number' || payload.price < 0) {
          throw new Error('Valid price is required');
        }
        if (!payload.area || typeof payload.area !== 'number' || payload.area <= 0) {
          throw new Error('Valid area is required');
        }
        if (!payload.location || !payload.location.city || payload.location.city.trim().length === 0) {
          throw new Error('Location with city is required');
        }
        
        // Validate area unit
        const validAreaUnits = ['sq.ft', 'sq.yd', 'sq.m', 'acres', 'marla', 'cents'];
        if (payload.areaUnit && !validAreaUnits.includes(payload.areaUnit)) {
          throw new Error(`Area unit must be one of: ${validAreaUnits.join(', ')}`);
        }
        
        // Validate residential specific fields
        if (payload.category === 'Residential') {
          if (payload.bhk && typeof payload.bhk !== 'string') {
            throw new Error('BHK must be a string');
          }
          if (payload.bathrooms && (typeof payload.bathrooms !== 'number' || payload.bathrooms < 0)) {
            throw new Error('Bathrooms must be a non-negative number');
          }
          if (payload.furnishing && !['Furnished', 'Semi-Furnished', 'Unfurnished'].includes(payload.furnishing)) {
            throw new Error('Furnishing must be Furnished, Semi-Furnished, or Unfurnished');
          }
        }
        
        // Validate commercial specific fields
        if (payload.category === 'Commercial') {
          if (payload.constructionStatus && !['New Launch', 'Under Construction', 'Ready to Move'].includes(payload.constructionStatus)) {
            throw new Error('Invalid construction status');
          }
          if (payload.investmentType && !['Assured Returns', 'Rental Yield', 'Lease Guarantee', 'ROI'].includes(payload.investmentType)) {
            throw new Error('Invalid investment type');
          }
        }
        
        // Validate arrays
        if (payload.amenities && !Array.isArray(payload.amenities)) {
          throw new Error('Amenities must be an array');
        }
        if (payload.features && !Array.isArray(payload.features)) {
          throw new Error('Features must be an array');
        }
        if (payload.images && !Array.isArray(payload.images)) {
          throw new Error('Images must be an array');
        }
        if (payload.videos && !Array.isArray(payload.videos)) {
          throw new Error('Videos must be an array');
        }
        
        return true;
      } catch (error) {
        throw new Error(`Invalid payload: ${error.message}`);
      }
    }),
  handleValidationErrors
];

/**
 * Lead creation validation
 */
const validateLead = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone number format'),
  body('property_id')
    .optional()
    .trim()
    .notEmpty().withMessage('Property ID is required if provided'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
  handleValidationErrors
];


/**
 * Review creation validation
 */
const validateReview = [
  body('property_id')
    .trim()
    .notEmpty().withMessage('Property ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateProperty,
  validateLead,
  validateReview
};

