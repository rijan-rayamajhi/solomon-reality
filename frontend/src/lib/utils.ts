// Auto-recreated by Cursor QA Auto-Fix Mode
// Utility functions for the application

/**
 * Format currency value to Indian Rupee format
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₹1,00,000")
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with Indian number system (lakhs, crores)
 * @param num - The number to format
 * @returns Formatted string (e.g., "1.5 L" or "10 Cr")
 */
export function formatIndianNumber(num: number): string {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)} K`;
  }
  return num.toString();
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text with ellipsis
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Format date to readable string
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Get relative time string (e.g., "2 days ago")
 * @param date - Date object or string
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Generate slug from string
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Class name utility for conditional classes
 * @param classes - Array of class names or objects
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Optimize ImageKit URL with transformations
 * @param url - ImageKit URL
 * @param options - Transformation options
 * @returns Optimized URL
 */
export function optimizeImageKitUrl(
  url: string | undefined | null,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  if (!url || typeof url !== 'string') {
    return url || '/placeholder-property.jpg';
  }

  // Check if it's an ImageKit URL
  if (!url.includes('ik.imagekit.io')) {
    return url;
  }

  const { width, height, quality = 'auto', format = 'auto' } = options;
  const transformations: string[] = [];

  if (width) transformations.push(`w-${width}`);
  if (height) transformations.push(`h-${height}`);
  if (quality) transformations.push(`q-${quality}`);
  if (format) transformations.push(`f-${format}`);

  if (transformations.length === 0) {
    // Default optimization: auto quality and format
    return `${url}?tr=f-auto,q-auto`;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tr=${transformations.join(',')}`;
}

/**
 * Get optimized image URL for property cards (thumbnails)
 * @param url - ImageKit URL
 * @returns Optimized thumbnail URL
 */
export function getPropertyCardImageUrl(url: string | undefined | null): string {
  return optimizeImageKitUrl(url, {
    width: 600,
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get optimized image URL for property details (hero images)
 * @param url - ImageKit URL
 * @returns Optimized hero image URL
 */
export function getPropertyHeroImageUrl(url: string | undefined | null): string {
  return optimizeImageKitUrl(url, {
    width: 1200,
    quality: 'auto',
    format: 'auto',
  });
}

