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

  // If there's a decimal part, append it with a comma (maximum 3 decimal places)
  if (decimalPart !== undefined) {
    const trimmedDecimal = decimalPart.slice(0, 3);
    if (trimmedDecimal && trimmedDecimal !== '000') {
      return `${formattedInteger},${trimmedDecimal}`;
    }
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
 * Parse date string from Vietnamese format (dd/mm/yyyy)
 * @param {string} value - The date string to parse
 * @returns {string} ISO date string (yyyy-mm-dd) or empty string
 */
export const parseDate = (value) => {
  if (!value) return '';
  const parts = value.split('/');
  if (parts.length !== 3) return '';

  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];

  if (year.length !== 4) return '';

  const d = new Date(`${year}-${month}-${day}`);
  if (isNaN(d.getTime())) return '';

  return `${year}-${month}-${day}`;
};

/**
 * Format date time to Vietnamese format
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date time string (e.g., 09:30 27/01/2026)
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return format(d, 'HH:mm dd/MM/yyyy');
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
 * Format date time to ISO string for input[type="datetime-local"]
 * @param {Date|string} date - The date to format
 * @returns {string} ISO datetime-local string (e.g., 2026-01-27T09:30)
 */
export const formatDateTimeISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  // Get offset in minutes and convert to +/-HH:mm manually or use local time
  // datetime-local expects local time string without offset
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
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

/**
 * Calculate remaining or overdue time
 * @param {Date|string} endDate - The deadline
 * @param {string} status - Current status of the task
 * @returns {object} Object containing text and color
 */
export const getRemainingTime = (endDate, status) => {
  if (!endDate) return { text: '---', color: 'text-gray-400' };

  if (['COMPLETED', 'ACCEPTED', 'DONE', 'INTERNAL_COMPLETED'].includes(status)) {
    return { text: '●', color: 'text-emerald-600 font-black text-3xl' };
  }

  if (status === 'CANCELLED') {
    return { text: '■', color: 'text-rose-600 font-black text-3xl' };
  }

  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end - now;

  if (diffTime < 0) {
    const absDiffTime = Math.abs(diffTime);
    let timeStr = '';
    if (absDiffTime < 24 * 60 * 60 * 1000) {
      const diffHours = Math.ceil(absDiffTime / (1000 * 60 * 60));
      timeStr = `${diffHours} tiếng`;
    } else {
      const diffDays = Math.floor(absDiffTime / (1000 * 60 * 60 * 24));
      timeStr = `${diffDays} ngày`;
    }
    return { text: `▼ ${timeStr}`, color: 'text-rose-600 font-black' };
  }

  const diffDaysFloat = diffTime / (1000 * 60 * 60 * 24);
  const diffDays = Math.ceil(diffDaysFloat);

  let color = 'text-blue-600 font-black'; // Default: Blue (> 3 days)
  let symbol = '▲';

  if (diffDaysFloat <= 1) {
    color = 'text-orange-600 font-black'; // Orange (<= 1 day)
  } else if (diffDaysFloat <= 3) {
    color = 'text-amber-500 font-black'; // Yellow (<= 3 days)
  }

  if (diffTime < 24 * 60 * 60 * 1000) {
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return { text: `${symbol} ${diffHours} giờ`, color: color };
  }
  return { text: `${symbol} ${diffDays} ngày`, color: color };
};
