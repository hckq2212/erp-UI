import { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2 } from 'lucide-react';
import { formatNumber, parseNumber } from '../../../utils/format';
import { useGetOpportunityServicesByOpportunityQuery } from '../../../api/opportunityService';
import { useGetServicesQuery } from '../../../api/services';

export const QuotationModal = ({ opportunity, isOpen, onClose, onSubmit, editQuotation = null, isSubmitting = false }) => {
  const [items, setItems] = useState([]);
  const [priceType, setPriceType] = useState('recommended'); // minimum, recommended, custom
  const [notes, setNotes] = useState('');
  const [showAddService, setShowAddService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const isEditMode = !!editQuotation;

  // Fetch opportunity services using RTK Query (only for create mode)
  const { data: servicesData, isLoading } = useGetOpportunityServicesByOpportunityQuery(
    opportunity?.id,
    { skip: !isOpen || !opportunity?.id || isEditMode }
  );

  // Fetch all available services
  const { data: allServices = [] } = useGetServicesQuery(
    {},
    { skip: !isOpen }
  );

  // Load data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editQuotation) {
      setNotes(editQuotation.note || '');
      const loadedItems = editQuotation.details?.map(detail => {
        const costPrice = parseFloat(detail.costAtSale) || 0;
        const sellingPrice = parseFloat(detail.sellingPrice) || 0;
        const minPrice = costPrice / 0.8;
        const recommendedPrice = costPrice / 0.6;

        return {
          serviceId: detail.service?.id || detail.serviceId,
          serviceName: detail.service?.name || 'Unknown Service',
          quantity: detail.quantity || 1,
          costPrice: costPrice,
          minPrice: minPrice,
          recommendedPrice: recommendedPrice,
          customPrice: sellingPrice,
          selectedPrice: sellingPrice,
          profitMargin: calculateProfitMargin(sellingPrice, costPrice)
        };
      }) || [];
      setItems(loadedItems);
      setPriceType('custom'); // Default to custom for edit mode
    }
  }, [isOpen, isEditMode, editQuotation]);

  // Load data for create mode
  useEffect(() => {
    if (isOpen && !isEditMode && servicesData) {
      const initialItems = servicesData.map(service => {
        const costPrice = parseFloat(service.service?.costPrice || service.costPrice) || 0;
        const minPrice = costPrice / 0.8; // 20% profit margin
        const recommendedPrice = costPrice / 0.6; // 40% profit margin

        return {
          serviceId: service.service?.id || service.id,
          serviceName: service.service?.name || service.name,
          quantity: service.quantity || 1,
          costPrice: costPrice,
          minPrice: minPrice,
          recommendedPrice: recommendedPrice,
          customPrice: recommendedPrice,
          selectedPrice: recommendedPrice,
          profitMargin: 40.0 // Default for 40% margin
        };
      });
      setItems(initialItems);
      setNotes('');
      setPriceType('recommended');
    }
  }, [isOpen, isEditMode, servicesData]);

  const calculateProfitMargin = (sellingPrice, costPrice) => {
    if (sellingPrice === 0) return 0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
  };

  const handlePriceTypeChange = (type) => {
    setPriceType(type);
    setItems(items.map(item => {
      let selectedPrice;
      if (type === 'minimum') {
        selectedPrice = item.minPrice;
      } else if (type === 'recommended') {
        selectedPrice = item.recommendedPrice;
      } else {
        selectedPrice = item.customPrice;
      }
      return {
        ...item,
        selectedPrice,
        profitMargin: calculateProfitMargin(selectedPrice, item.costPrice)
      };
    }));
  };

  const handleCustomPriceChange = (index, value) => {
    const numValue = parseNumber(value);
    setItems(items.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          customPrice: numValue,
          selectedPrice: priceType === 'custom' ? numValue : item.selectedPrice,
          profitMargin: priceType === 'custom' ? calculateProfitMargin(numValue, item.costPrice) : item.profitMargin
        };
      }
      return item;
    }));
  };

  const handleQuantityChange = (index, value) => {
    const numValue = parseInt(value) || 1;
    setItems(items.map((item, i) => i === index ? { ...item, quantity: numValue } : item));
  };

  const handleRemoveService = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleAddService = () => {
    if (!selectedServiceId) return;

    const service = allServices.find(s => String(s.id) === String(selectedServiceId));
    if (!service) return;

    // Check if service already exists
    if (items.find(item => item.serviceId === service.id)) {
      alert('Dịch vụ này đã được thêm vào báo giá');
      return;
    }

    const costPrice = parseFloat(service.costPrice) || 0;
    const minPrice = costPrice / 0.8;
    const recommendedPrice = costPrice / 0.6;

    const newItem = {
      serviceId: service.id,
      serviceName: service.name,
      quantity: 1,
      costPrice: costPrice,
      minPrice: minPrice,
      recommendedPrice: recommendedPrice,
      customPrice: recommendedPrice,
      selectedPrice: priceType === 'minimum' ? minPrice : priceType === 'recommended' ? recommendedPrice : recommendedPrice,
      profitMargin: calculateProfitMargin(
        priceType === 'minimum' ? minPrice : priceType === 'recommended' ? recommendedPrice : recommendedPrice,
        costPrice
      )
    };

    setItems([...items, newItem]);
    setSelectedServiceId('');
    setShowAddService(false);
  };

  // Get available services that are not already in the list
  const availableServices = allServices.filter(
    service => !items.find(item => String(item.serviceId) === String(service.id))
  );

  const totals = items.reduce((acc, item) => {
    const revenue = item.selectedPrice * item.quantity;
    const cost = item.costPrice * item.quantity;
    return {
      revenue: acc.revenue + revenue,
      cost: acc.cost + cost
    };
  }, { revenue: 0, cost: 0 });

  const overallProfitMargin = totals.revenue > 0
    ? ((totals.revenue - totals.cost) / totals.revenue) * 100
    : 0;

  const handleSubmit = () => {
    const submitData = {
      note: notes,
      details: items.map(item => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        sellingPrice: item.selectedPrice,
        costAtSale: item.costPrice
      }))
    };

    if (isEditMode) {
      onSubmit(submitData, editQuotation.id);
    } else {
      onSubmit(submitData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'Chỉnh sửa báo giá' : `Báo giá ${opportunity?.name}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-8 h-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500 text-sm">Đang tải dịch vụ...</p>
            </div>
          </div>
        ) : (
          <div className="p-6">

            {/* Items Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hạng mục</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Số lượng</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá vốn</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá bán tối thiểu</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá bán đề xuất</th>
                    {priceType === 'custom' && (
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá bán tùy chỉnh</th>
                    )}
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Tỉ suất lợi nhuận</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.serviceName}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {formatNumber(item.costPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {formatNumber(item.minPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {formatNumber(item.recommendedPrice)}
                      </td>
                      {priceType === 'custom' && (
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={formatNumber(item.customPrice)}
                            onChange={(e) => handleCustomPriceChange(index, e.target.value)}
                            className="w-full px-2 py-1 text-right border border-gray-300 rounded text-sm"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-right text-sm font-medium text-blue-600">
                        {item.profitMargin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveService(index)}
                          disabled={items.length <= 1}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={items.length <= 1 ? 'Phải có ít nhất 1 dịch vụ' : 'Xóa dịch vụ'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Service Section */}
            <div className="mb-6">
              {!showAddService ? (
                <button
                  onClick={() => setShowAddService(true)}
                  disabled={availableServices.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Thêm dịch vụ</span>
                </button>
              ) : (
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn dịch vụ
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Chọn dịch vụ --</option>
                      {availableServices.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {formatNumber(service.costPrice)} VNĐ
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddService}
                    disabled={!selectedServiceId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Thêm
                  </button>
                  <button
                    onClick={() => {
                      setShowAddService(false);
                      setSelectedServiceId('');
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}
              {availableServices.length === 0 && !showAddService && (
                <p className="text-sm text-gray-500 mt-2">Tất cả dịch vụ đã được thêm vào báo giá</p>
              )}
            </div>

            {/* Price Type Selection */}
            <div className="mb-6 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priceType"
                  value="recommended"
                  checked={priceType === 'recommended'}
                  onChange={(e) => handlePriceTypeChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Chọn giá bán đề xuất</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priceType"
                  value="minimum"
                  checked={priceType === 'minimum'}
                  onChange={(e) => handlePriceTypeChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Chọn giá bán tối thiểu</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priceType"
                  value="custom"
                  checked={priceType === 'custom'}
                  onChange={(e) => handlePriceTypeChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Chọn giá bán tùy chỉnh</span>
              </label>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Tổng doanh thu:</p>
                  <p className="text-xl font-bold text-blue-900">{formatNumber(totals.revenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Tổng vốn:</p>
                  <p className="text-xl font-bold text-blue-900">{formatNumber(totals.cost)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Tỉ suất lợi nhuận:</p>
                  <p className="text-xl font-bold text-blue-900">{overallProfitMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập ghi chú cho báo giá..."
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <button
                onClick={handleSubmit}
                disabled={items.length === 0 || isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật' : 'Tạo báo giá')}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
