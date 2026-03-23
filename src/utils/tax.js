/**
 * Fetch business information from xinvoice.vn based on Tax ID (Mã số thuế)
 * @param {string} taxId - The tax ID to fetch info for (10 or 13 digits)
 * @returns {Promise<{name: string, address: string} | null>}
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
    const response = await fetch(`https://api.xinvoice.vn/gdt-api/tax-payer/${cleanTaxId}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.name) {
      return {
        name: data.name,
        address: data.address || '',
        status: data.status,
        taxDepartment: data.taxDepartment
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching tax info:', error);
    return null;
  }
};
