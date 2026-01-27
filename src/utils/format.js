/**
 * Format number with thousand separators (Vietnamese format)
 * @param {number|string} value - The number to format
 * @returns {string} Formatted number string (e.g., 100.000.000)
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '';
  // Parse string directly without removing dots (for decimal numbers like "10000000.00")
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  // Round to integer to avoid decimal places
  return Math.round(num).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
};

/**
 * Parse formatted number string back to number
 * @param {string} value - The formatted string (e.g., "100.000.000")
 * @returns {number} The parsed number (rounded to integer)
 */
export const parseNumber = (value) => {
  if (!value) return 0;
  const cleaned = String(value).replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
};

/**
 * Format currency with VNĐ suffix
 * @param {number|string} value - The number to format
 * @returns {string} Formatted currency string (e.g., 100.000.000 VNĐ)
 */
export const formatCurrency = (value) => {
  const formatted = formatNumber(value);
  return formatted ? `${formatted} VNĐ` : '';
};

/**
 * Format date to Vietnamese format
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string (e.g., 27/01/2026)
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
};

/**
 * Format date to ISO string for input[type="date"]
 * @param {Date|string} date - The date to format
 * @returns {string} ISO date string (e.g., 2026-01-27)
 */
export const formatDateISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

/**
 * Format percentage
 * @param {number} value - The percentage value
 * @returns {string} Formatted percentage string (e.g., 75%)
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined) return '';
  return `${value}%`;
};
