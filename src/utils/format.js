import { format } from 'date-fns';

/**
 * Format number with thousand separators (Vietnamese format)
 * @param {number|string} value - The number to format
 * @returns {string} Formatted number string (e.g., 100.000.000)
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '';

  // Convert to string and handle both dot and comma as decimal separators initially
  const strValue = String(value).replace(/,/g, '.');
  const parts = strValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Format integer part with dots as thousand separators
  const numInteger = parseInt(integerPart || '0');
  const formattedInteger = isNaN(numInteger) ? '0' : numInteger.toLocaleString('vi-VN');

  // If there's a decimal part, append it with a comma
  if (decimalPart !== undefined) {
    return `${formattedInteger},${decimalPart}`;
  }

  return formattedInteger;
};

/**
 * Parse formatted number string back to number
 * @param {string} value - The formatted string (e.g., "100.000,500")
 * @returns {number} The parsed number (float)
 */
export const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const cleaned = String(value).replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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
  return format(d, 'dd/MM/yyyy');
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
