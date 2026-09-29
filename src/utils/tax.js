/**
 * Fetch business information based on Tax ID (Mã số thuế) via VietQR API (CORS enabled)
 * @param {string} taxId - The tax ID to fetch info for (10 or 13 digits)
 * @returns {Promise<{name: string, address: string, status?: string, internationalName?: string, shortName?: string} | null>}
 */
export const fetchTaxInfo = async (taxId) => {
  if (!taxId) return null;

  // Clean tax ID: remove spaces and dashes
  const cleanTaxId = taxId.replace(/[\s-]/g, '');

  // Basic validation: 10 or 13 digits
  if (!/^\d{10}(\d{3})?$/.test(cleanTaxId)) {
    return null;
  }

  try {
    const response = await fetch(`https://api.vietqr.io/v2/business/${cleanTaxId}`);
    if (!response.ok) {
      return null;
    }

    const res = await response.json();
    if (res && res.code === '00' && res.data && res.data.name) {
      return {
        name: res.data.name,
        address: res.data.address || '',
        status: res.data.status,
        internationalName: res.data.internationalName || '',
        shortName: res.data.shortName || ''
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching tax info:', error);
    return null;
  }
};

