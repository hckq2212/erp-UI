import { BASE_URL } from '../store/api';

/**
 * Tra cứu thông tin doanh nghiệp theo Mã Số Thuế (MST) qua Backend Proxy (có cache Redis)
 * @param {string} taxId - Mã số thuế (10 hoặc 13 chữ số)
 * @returns {Promise<{name: string, address: string, status?: string, internationalName?: string, shortName?: string, taxDepartment?: string} | null>}
 */
export const fetchTaxInfo = async (taxId) => {
  if (!taxId) return null;

  // Làm sạch mã số thuế: bỏ khoảng trắng và dấu gạch ngang
  const cleanTaxId = taxId.replace(/[\s-]/g, '');

  // Kiểm tra định dạng: 10 chữ số hoặc 13 chữ số
  if (!/^\d{10}(\d{3})?$/.test(cleanTaxId)) {
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/customers/tax-lookup/${cleanTaxId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const res = await response.json();
    if (res && res.data && res.data.name) {
      return {
        name: res.data.name,
        address: res.data.address || '',
        status: res.data.status,
        internationalName: res.data.internationalName || '',
        shortName: res.data.shortName || '',
        taxDepartment: res.data.taxDepartment || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching tax info via backend proxy:', error);
    return null;
  }
};
