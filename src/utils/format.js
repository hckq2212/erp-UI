import { format } from 'date-fns';

/**
 * Format number with thousand separators (Vietnamese format)
 * Quy ước: "." = hàng nghìn, "," = thập phân.
 * - Kiểu number: dấu "." của JS là thập phân (1234.5 -> "1.234,5")
 * - Kiểu string: coi là chuỗi kiểu VN, dấu "." luôn là hàng nghìn
 *   (nếu nhận chuỗi thập phân kiểu quốc tế từ API, hãy Number() trước khi truyền vào)
 * @param {number|string} value - The number to format
 * @returns {string} Formatted number string (e.g., 100.000.000)
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '';

  let strValue = String(value).trim();
  const isNegative = strValue.startsWith('-');
  if (isNegative) {
    strValue = strValue.slice(1).trim();
  }

  let integerPart = '';
  let decimalPart = undefined;

  if (typeof value === 'number') {
    const parts = strValue.split('.');
    integerPart = parts[0];
    decimalPart = parts[1];
  } else if (strValue.includes(',')) {
    const parts = strValue.split(',');
    integerPart = parts[0].replace(/\./g, '');
    decimalPart = parts[1];
  } else {
    integerPart = strValue.replace(/\./g, '');
  }

  const cleanInt = integerPart.replace(/\D/g, '');
  if (!cleanInt) return '0';

  const formattedInteger = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  let result = formattedInteger;
  if (decimalPart !== undefined) {
    const trimmedDecimal = decimalPart.replace(/\D/g, '').slice(0, 3);
    if (trimmedDecimal === '' && typeof value === 'string') {
      result = `${formattedInteger}.`;
    } else if (trimmedDecimal && trimmedDecimal !== '000') {
      result = `${formattedInteger}.${trimmedDecimal}`;
    }
  }

  return isNegative ? `-${result}` : result;
};

/**
 * Parse formatted number string back to number
 * @param {string|number} value - The formatted string (e.g., "100.000,500") or number
 * @returns {number} The parsed number (float)
 */
export const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  let str = String(value).trim();
  const isNegative = str.startsWith('-');
  if (isNegative) str = str.slice(1).trim();

  str = str.replace(/[^\d.,]/g, '');
  if (!str) return 0;

  let cleaned = '';
  if (str.includes(',')) {
    cleaned = str.replace(/\./g, '').replace(/,/g, '.');
  } else {
    cleaned = str.replace(/\./g, '');
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
};


/**
 * Format API currency with VNĐ suffix. A single dot in a numeric string is
 * the Decimal separator ("70000.000" -> "70.000 VNĐ"). Keep the string's
 * digits intact so display does not round VAT/totals or lose large amounts.
 * Use inputFormat: 'vi' for an already masked string such as "70.000".
 * @param {number|string} value - The number to format
 * @param {{inputFormat?: 'decimal'|'vi'}} options - The source number format
 * @returns {string} Formatted currency string (e.g., 100.000.000 VNĐ)
 */
export const formatCurrency = (value, { inputFormat = 'decimal' } = {}) => {
  const decimal = String(value ?? '').trim().match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (inputFormat === 'decimal' && decimal) {
    const [, sign, integer, fraction = ''] = decimal;
    const grouped = integer.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const significantFraction = fraction.replace(/0+$/, '');
    return `${sign}${grouped}${significantFraction ? `,${significantFraction}` : ''} VNĐ`;
  }

  // Preserve legacy support for Vietnamese strings with multiple groups.
  const formatted = formatNumber(value);
  return formatted ? `${formatted} VNĐ` : '';
};

const compactCurrencyFormatter = new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * Format compact currency / number with Vietnamese short notation (e.g., 1,5 Tr, 2,8 Tỷ)
 * @param {number|string} value - The number to format
 * @returns {string} Formatted compact string
 */
export const formatCompactCurrency = (value = 0) => {
  const amount = Number(value || 0);
  if (!amount) return '0';
  return compactCurrencyFormatter.format(amount);
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
  
  if (status === 'CANCELLED') {
    return { text: '---', color: 'text-red-600 font-black text-xl' };
  }
  
  if (!endDate) 
  {
    return { text: '---', color: 'text-gray-400' };
  }  

  if (['COMPLETED', 'ACCEPTED', 'DONE', 'INTERNAL_COMPLETED'].includes(status)) {
    return { text: '●', color: 'text-emerald-600 font-black text-3xl' };
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

export const formatDateToDDMMYYYY = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return format(d, 'dd-MM-yyyy');
};

export const formatDateToYYYYMMDD = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return format(d, 'yyyy-MM-dd');
};

export const maskIdCardNumber = (value) => {
  if (!value) return '';
  const clean = String(value).trim();
  if (clean.length <= 4) return clean;
  if (clean.length <= 6) return clean.slice(0, 2) + '*'.repeat(clean.length - 3) + clean.slice(-1);
  const first = clean.slice(0, 3);
  const last = clean.slice(-3);
  const middleCount = Math.max(3, clean.length - 6);
  return `${first}${'*'.repeat(middleCount)}${last}`;
};
