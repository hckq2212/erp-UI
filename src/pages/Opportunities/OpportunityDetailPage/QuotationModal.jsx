import { useState, useEffect, useMemo, Fragment } from 'react';
import { X, FileText, Plus, Trash2, Briefcase } from 'lucide-react';
import { formatNumber, parseNumber } from '../../../utils/format';
import { useGetOpportunityServicesByOpportunityQuery } from '../../../api/opportunityService';
import { useGetServicesQuery } from '../../../api/services';
import { useGetServicePackagesQuery } from '../../../api/servicePackages';

export const QuotationModal = ({ opportunity, isOpen, onClose, onSubmit, editQuotation = null, isSubmitting = false }) => {
  const [items, setItems] = useState([]);
  const [priceType, setPriceType] = useState('recommended'); // minimum, recommended, custom
  const [notes, setNotes] = useState('');
  const [showAddService, setShowAddService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('');
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

  const { data: packageTemplates = [] } = useGetServicePackagesQuery(
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
        const minPrice = roundToHundredThousands(costPrice / 0.8);
        const recommendedPrice = roundToHundredThousands(costPrice / 0.6);

        return {
          serviceId: detail.service?.id || detail.serviceId,
          serviceName: detail.service?.name || 'Unknown Service',
          quantity: detail.quantity || 1,
          costPrice: costPrice,
          minPrice: minPrice,
          recommendedPrice: recommendedPrice,
          customPrice: sellingPrice,
          selectedPrice: sellingPrice,
          profitMargin: calculateProfitMargin(sellingPrice, costPrice),
          vat: sellingPrice * 0.08,
          totalWithVat: roundToHundredThousands(sellingPrice * 1.08),
          packageName: detail.packageName || 'STANDALONE',
          packageQuantity: detail.packageQuantity || 1,
          norm: detail.quantity / (detail.packageQuantity || 1),
          servicePackageId: detail.servicePackageId
        };
      }) || [];
      setItems(loadedItems);
      setPriceType('custom'); // Default to custom for edit mode
    }
  }, [isOpen, isEditMode, editQuotation]);

  // Load data for create mode
  useEffect(() => {
    if (isOpen && !isEditMode && servicesData) {
      // Standalone services (filter out services belonging to packages)
      const standaloneItems = servicesData
        .filter(service => !service.opportunityPackageId)
        .map(service => {
          const costPrice = parseFloat(service.service?.costPrice || service.costPrice) || 0;
          const minPrice = roundToHundredThousands(costPrice / 0.8);
          const recommendedPrice = roundToHundredThousands(costPrice / 0.6);

          return {
            serviceId: service.service?.id || service.id,
            serviceName: service.service?.name || service.name,
            quantity: service.quantity || 1,
            costPrice: costPrice,
            minPrice: minPrice,
            recommendedPrice: recommendedPrice,
            customPrice: recommendedPrice,
            selectedPrice: recommendedPrice,
            profitMargin: calculateProfitMargin(recommendedPrice, costPrice),
            packageName: 'STANDALONE'
          };
        });

      // Package services
      const packageItems = (opportunity?.packages || []).flatMap(pkg =>
        (pkg.services || []).map(ps => {
          const costPrice = parseFloat(ps.service?.costPrice || ps.sellingPrice) || 0;
          const minPrice = roundToHundredThousands(costPrice / 0.8);
          const recommendedPrice = roundToHundredThousands(costPrice / 0.6);

          return {
            serviceId: ps.serviceId,
            serviceName: ps.service?.name || ps.name || 'Dịch vụ trong gói',
            quantity: ps.quantity || 1,
            costPrice: costPrice,
            minPrice: minPrice,
            recommendedPrice: recommendedPrice,
            customPrice: recommendedPrice,
            selectedPrice: recommendedPrice,
            profitMargin: calculateProfitMargin(recommendedPrice, costPrice),
            packageName: pkg.name,
            packageQuantity: pkg.quantity || 1,
            norm: ps.quantity / (pkg.quantity || 1),
            servicePackageId: pkg.servicePackageId
          };
        })
      );

      setItems([...standaloneItems, ...packageItems]);
      setNotes('');
      setPriceType('recommended');
    }
  }, [isOpen, !isEditMode, servicesData, opportunity?.packages]);

  const roundToHundredThousands = (value) => {
    return Math.ceil(value / 100000) * 100000;
  };

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

  const handleQuantityChange = (key, value) => {
    const numValue = parseInt(value) || 1;
    if (key === 'STANDALONE') return;

    setItems(items.map((item) => {
      if (item.packageName === key) {
        return {
          ...item,
          packageQuantity: numValue,
          quantity: item.norm * numValue
        };
      }
      return item;
    }));
  };

  const handleStandaloneQuantityChange = (index, value) => {
    const numValue = parseInt(value) || 1;
    setItems(items.map((item, i) => i === index ? { ...item, quantity: numValue } : item));
  };

  const handleRemovePackage = (packageName) => {
    setItems(items.filter(item => item.packageName !== packageName));
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
    const minPrice = roundToHundredThousands(costPrice / 0.8);
    const recommendedPrice = roundToHundredThousands(costPrice / 0.6);

    const newItem = {
      serviceId: service.id,
      serviceName: service.name,
      quantity: 1,
      packageQuantity: 1,
      norm: 1,
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

    setItems([...items, { ...newItem, packageName: 'STANDALONE' }]);
    setSelectedServiceId('');
    setShowAddService(false);
  };

  const handleAddPackage = () => {
    if (!selectedPackageId) return;

    const template = packageTemplates.find(t => String(t.id) === String(selectedPackageId));
    if (!template) return;

    // Check if package name already exists to avoid confusion
    if (items.find(item => item.packageName === template.name)) {
      alert(`Gói "${template.name}" đã có trong báo giá.`);
      return;
    }

    const packageItems = (template.items || []).map(ps => {
      const costPrice = parseFloat(ps.service?.costPrice || ps.sellingPrice) || 0;
      const minPrice = roundToHundredThousands(costPrice / 0.8);
      const recommendedPrice = roundToHundredThousands(costPrice / 0.6);

      return {
        serviceId: ps.service?.id || ps.serviceId,
        serviceName: ps.service?.name || ps.name || 'Dịch vụ trong gói',
        quantity: ps.defaultQuantity || 1,
        costPrice: costPrice,
        minPrice: minPrice,
        recommendedPrice: recommendedPrice,
        customPrice: recommendedPrice,
        selectedPrice: priceType === 'minimum' ? minPrice : recommendedPrice,
        profitMargin: calculateProfitMargin(
          priceType === 'minimum' ? minPrice : recommendedPrice,
          costPrice
        ),
        packageName: template.name,
        packageQuantity: 1,
        norm: ps.defaultQuantity || 1,
        servicePackageId: template.id
      };
    });

    setItems([...items, ...packageItems]);
    setSelectedPackageId('');
    setShowAddPackage(false);
  };

  // Get available services that are not already in the list
  const availableServices = allServices.filter(
    service => !items.find(item => String(item.serviceId) === String(service.id))
  );

  const totals = items.reduce((acc, item) => {
    const revenue = (item.selectedPrice || 0) * (item.quantity || 0);
    const cost = (item.costPrice || 0) * (item.quantity || 0);
    const vat = revenue * 0.08;
    const totalWithVat = roundToHundredThousands(revenue + vat);
    return {
      revenue: acc.revenue + revenue,
      cost: acc.cost + cost,
      vat: acc.vat + vat,
      totalWithVat: acc.totalWithVat + totalWithVat
    };
  }, { revenue: 0, cost: 0, vat: 0, totalWithVat: 0 });

  const overallProfitMargin = totals.revenue > 0
    ? ((totals.revenue - totals.cost) / totals.revenue) * 100
    : 0;

  const displayGroups = useMemo(() => {
    const packages = {};
    const standalone = [];

    items.forEach((item, index) => {
      const key = item.packageName || 'STANDALONE';
      if (key === 'STANDALONE') {
        standalone.push({ ...item, originalIndex: index });
      } else {
        if (!packages[key]) {
          packages[key] = {
            name: key,
            quantity: item.packageQuantity || 1,
            costPrice: 0,
            minPrice: 0,
            recommendedPrice: 0,
            customPrice: 0,
            selectedPrice: 0,
            vat: 0,
            totalWithVat: 0,
            items: []
          };
        }
        const itemRevenue = item.selectedPrice * item.quantity;
        const itemVat = itemRevenue * 0.08;
        const itemTotalWithVat = roundToHundredThousands(itemRevenue + itemVat);

        packages[key].costPrice += item.costPrice;
        packages[key].minPrice += item.minPrice;
        packages[key].recommendedPrice += item.recommendedPrice;
        packages[key].customPrice += item.customPrice;
        packages[key].selectedPrice += item.selectedPrice;
        packages[key].vat += itemVat;
        packages[key].totalWithVat += itemTotalWithVat;
        packages[key].items.push({ ...item, originalIndex: index });
      }
    });

    const packageServiceIds = new Set();
    Object.values(packages).forEach(pkg => {
      pkg.items.forEach(item => {
        if (item.serviceId) packageServiceIds.add(String(item.serviceId));
      });
    });

    return {
      packages: Object.values(packages).map(pkg => ({
        ...pkg,
        profitMargin: calculateProfitMargin(pkg.selectedPrice, pkg.costPrice)
      })),
      standalone: standalone.filter(s => !packageServiceIds.has(String(s.serviceId)))
    };
  }, [items]);

  const handleSubmit = () => {
    const submitData = {
      note: notes,
      details: items.map(item => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        sellingPrice: item.selectedPrice,
        costAtSale: item.costPrice,
        name: item.serviceName,
        packageQuantity: item.packageQuantity || 1,
        packageName: item.packageName !== 'STANDALONE' ? item.packageName : undefined,
        servicePackageId: item.servicePackageId,
        isPackageService: item.packageName !== 'STANDALONE'
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
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">VAT (8%)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Thành tiền</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Render Packages */}
                  {displayGroups.packages.map((pkg, pIdx) => (
                    <Fragment key={`pkg-${pIdx}`}>
                      <tr className="bg-blue-50/50 border-b border-blue-100">
                        <td className="px-4 py-2 text-sm font-bold text-blue-900">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">Gói</span>
                            {pkg.name}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              min="1"
                              value={pkg.quantity}
                              onChange={(e) => handleQuantityChange(pkg.name, e.target.value)}
                              className="w-16 px-2 py-1 text-center border-2 border-blue-200 rounded text-sm font-bold text-blue-900 bg-white"
                            />
                            <span className="ml-1 text-[10px] text-blue-400 font-black uppercase">Gói</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-bold text-blue-900">
                          {formatNumber(pkg.costPrice)}
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-blue-700">
                          {formatNumber(pkg.minPrice)}
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-blue-700">
                          {formatNumber(pkg.recommendedPrice)}
                        </td>
                        {priceType === 'custom' && (
                          <td className="px-4 py-2 text-right text-sm text-gray-400 italic">
                            {formatNumber(pkg.selectedPrice)}
                          </td>
                        )}
                        <td className={`px-4 py-2 text-right text-sm font-black ${pkg.profitMargin < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {pkg.profitMargin.toFixed(1)}%
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-bold text-blue-900">
                          {formatNumber(pkg.vat)}
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-bold text-blue-900">
                          {formatNumber(pkg.totalWithVat)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleRemovePackage(pkg.name)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-white rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {/* Sub-items in package */}
                      {pkg.items.map((item, iIdx) => (
                        <tr key={`pkg-${pIdx}-item-${iIdx}`} className="border-b border-gray-50 bg-blue-50/10">
                          <td className="px-4 py-2 text-sm text-gray-600 pl-10 italic">
                            • {item.serviceName}
                          </td>
                          <td className="px-4 py-2 text-center text-[10px] text-gray-400 font-bold uppercase">
                            Số lượng: {Number(item.norm) % 1 === 0 ? item.norm : Number(item.norm).toFixed(2).replace(/\.?0+$/, '')} / gói
                          </td>
                          <td className="px-4 py-2 text-right text-xs text-gray-400">
                            {formatNumber(item.costPrice)}
                          </td>
                          <td colSpan={priceType === 'custom' ? 4 : 3} className="px-4 py-2 text-right text-[10px] text-gray-400 font-bold uppercase">
                            (Giá bán: {formatNumber(item.selectedPrice)} / đv)
                          </td>
                          <td></td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}

                  {/* Render Standalone Services */}
                  {displayGroups.standalone.length > 0 && (
                    <>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <td colSpan={priceType === 'custom' ? 10 : 9} className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                          Dịch vụ lẻ
                        </td>
                      </tr>
                      {displayGroups.standalone.map((item, idx) => (
                        <tr key={`standalone-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.serviceName}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleStandaloneQuantityChange(item.originalIndex, e.target.value)}
                              className="w-20 mx-auto px-2 py-1 text-center border border-gray-300 rounded text-sm block"
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
                                onChange={(e) => handleCustomPriceChange(item.originalIndex, e.target.value)}
                                className="w-full px-2 py-1 text-right border border-gray-300 rounded text-sm"
                              />
                            </td>
                          )}
                          <td className={`px-4 py-3 text-right text-sm font-medium ${item.profitMargin < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {item.profitMargin.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatNumber((item.selectedPrice * item.quantity) * 0.08)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {formatNumber(roundToHundredThousands((item.selectedPrice * item.quantity) * 1.08))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleRemoveService(item.originalIndex)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Service Section */}
            <div className="mb-6">
              {!showAddService ? (
                <button
                  onClick={() => setShowAddService(true)}
                  className="flex items-center gap-2 mb-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Thêm dịch vụ</span>
                </button>
              ) : (
                <div className="flex gap-3 items-end p-4 bg-gray-50 rounded-xl animate-in fade-in slide-in-from-top-2 border border-blue-100">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn dịch vụ lẻ
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Thêm
                  </button>
                  <button
                    onClick={() => {
                      setShowAddService(false);
                      setSelectedServiceId('');
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {/* Add Package Section */}
              {!showAddPackage ? (
                <button
                  onClick={() => setShowAddPackage(true)}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm font-medium">Thêm gói</span>
                </button>
              ) : (
                <div className="flex gap-3 items-end p-4 bg-indigo-50/30 rounded-xl animate-in fade-in slide-in-from-top-2 border border-indigo-100">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-indigo-900 mb-2">
                      Chọn gói dịch vụ mẫu
                    </label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shrink-0"
                    >
                      <option value="">-- Chọn gói mẫu --</option>
                      {packageTemplates
                        .filter(t => !items.some(item => item.packageName === t.name))
                        .map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.items?.length || 0} dịch vụ)
                          </option>
                        ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddPackage}
                    disabled={!selectedPackageId}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Áp dụng gói
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPackage(false);
                      setSelectedPackageId('');
                    }}
                    className="px-4 py-2 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                </div>
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
                  <p className="text-sm text-blue-700 mb-1">Tổng VAT (8%):</p>
                  <p className="text-xl font-bold text-blue-900">{formatNumber(totals.vat)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Tổng cộng (có VAT):</p>
                  <p className="text-xl font-bold text-blue-900">{formatNumber(totals.totalWithVat)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Tổng vốn:</p>
                  <p className="text-xl font-bold text-blue-900">{formatNumber(totals.cost)}</p>
                </div>
                <div>
                  <p className={`text-sm mb-1 ${overallProfitMargin < 0 ? 'text-red-700' : 'text-blue-700'
                    }`}>Tỉ suất lợi nhuận:</p>
                  <p className={`text-xl font-bold ${overallProfitMargin < 0 ? 'text-red-900' : 'text-blue-900'
                    }`}>{overallProfitMargin.toFixed(1)}%</p>
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
