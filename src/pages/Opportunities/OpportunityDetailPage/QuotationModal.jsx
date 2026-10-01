import { useState, useEffect, useMemo, Fragment } from 'react';
import { X, FileText, Plus, Trash2, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import Select from 'react-select';
import { formatNumber, parseNumber } from '../../../utils/format';
import { useGetOpportunityServicesByOpportunityQuery } from '../../../api/opportunityService';
import { useGetServicesQuery } from '../../../api/services';
import { useGetServicePackagesQuery } from '../../../api/servicePackages';
import { toast } from 'react-toastify';

const selectStyles = (focusColor = '#fb923c') => ({
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 12,
    borderColor: state.isFocused ? focusColor : '#d1d5db',
    boxShadow: state.isFocused ? `0 0 0 1px ${focusColor}` : 'none',
    '&:hover': { borderColor: focusColor },
    backgroundColor: '#fff',
    cursor: 'text',
  }),
  valueContainer: (base) => ({ ...base, padding: '2px 12px' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: '#9ca3af' }),
  menu: (base) => ({
    ...base,
    borderRadius: 12,
    padding: 4,
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    border: '1px solid #f3f4f6',
  }),
  menuList: (base) => ({ ...base, maxHeight: 280, padding: 0 }),
  option: (base, state) => ({
    ...base,
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    cursor: 'pointer',
    color: '#111827',
    backgroundColor: state.isSelected
      ? '#e5e7eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    ':active': { backgroundColor: '#e5e7eb' },
  }),
  placeholder: (base) => ({ ...base, color: '#9ca3af', fontSize: 14 }),
  noOptionsMessage: (base) => ({ ...base, fontSize: 13 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
});

const normalizeServiceJobs = (jobs = []) => jobs.map((serviceJob) => {
  const job = serviceJob.job || serviceJob;

  return {
    id: serviceJob.id || job.id || serviceJob.jobId,
    name: serviceJob.name || job.name || 'Hạng mục',
    quantity: Number(serviceJob.quantity || 1),
    unit: job.unit || serviceJob.unit || '',
    costAtSale: Number(serviceJob.costAtSale ?? job.costPrice ?? 0),
    isQuotationItem: serviceJob.isQuotationItem ?? job.isQuotationItem ?? true,
    isBriefVideo: Boolean(serviceJob.isBriefVideo ?? job.isBriefVideo),
  };
});

export const QuotationModal = ({ opportunity, isOpen, onClose, onSubmit, editQuotation = null, isSubmitting = false }) => {
  const [items, setItems] = useState([]);
  const [priceType, setPriceType] = useState('custom'); // minimum, recommended, custom
  const [notes, setNotes] = useState('');
  const [showAddService, setShowAddService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [expandedRows, setExpandedRows] = useState({ packages: {}, services: {} });
  const isEditMode = !!editQuotation;

  // Fetch opportunity services using RTK Query (only for create mode)
  const { data: servicesData, isLoading } = useGetOpportunityServicesByOpportunityQuery(
    opportunity?.id,
    { skip: !isOpen || !opportunity?.id || isEditMode }
  );
  const incompleteAiJobs = useMemo(() => (servicesData || []).flatMap(service => {
    if (!service.service?.isAI) return [];

    return (service.jobs || []).filter(job =>
      job.isQuotationItem &&
      !job.isBriefVideo &&
      Number(job.costAtSale || 0) <= 0
    );
  }), [servicesData]);

  // Fetch all available services
  const { data: servicesResponse } = useGetServicesQuery(
    {},
    { skip: !isOpen }
  );
  const allServices = useMemo(() => Array.isArray(servicesResponse) ? servicesResponse : (servicesResponse?.data || []), [servicesResponse]);
  const servicesById = useMemo(
    () => new Map(allServices.map(service => [String(service.id), service])),
    [allServices]
  );

  const { data: packageTemplates = [] } = useGetServicePackagesQuery(
    {},
    { skip: !isOpen }
  );

  useEffect(() => {
    if (!isOpen) {
      setShowAddService(false);
      setSelectedServiceId('');
      setShowAddPackage(false);
      setSelectedPackageId('');
      setExpandedRows({ packages: {}, services: {} });
    }
  }, [isOpen]);

  // Load data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editQuotation) {
      setNotes(editQuotation.note || '');
      const loadedItems = editQuotation.details?.map(detail => {
        const costPrice = parseFloat(detail.costAtSale) || 0;
        const sellingPrice = parseFloat(detail.sellingPrice) || 0;
        const minPrice = roundToTenThousands(costPrice / 0.8);
        const recommendedPrice = roundToTenThousands(costPrice / 0.6);
        const serviceId = detail.service?.id || detail.serviceId;
        const opportunityService = detail.packageName
          ? (opportunity?.packages || [])
            .filter(pkg => !detail.servicePackageId || String(pkg.servicePackageId) === String(detail.servicePackageId))
            .flatMap(pkg => pkg.services || [])
            .find(service => String(service.service?.id || service.serviceId) === String(serviceId))
          : (opportunity?.services || [])
            .filter(service => !service.opportunityPackageId)
            .find(service => String(service.service?.id || service.serviceId) === String(serviceId));

        return {
          serviceId,
          serviceName: detail.service?.name || 'Unknown Service',
          quantity: detail.quantity || 1,
          costPrice: costPrice,
          minPrice: minPrice,
          recommendedPrice: recommendedPrice,
          customPrice: sellingPrice,
          selectedPrice: sellingPrice,
          profitMargin: calculateProfitMargin(sellingPrice, costPrice),
          vat: sellingPrice * 0.08,
          totalWithVat: sellingPrice * 1.08,
          packageName: detail.packageName || 'STANDALONE',
          packageQuantity: detail.packageQuantity || 1,
          norm: detail.quantity / (detail.packageQuantity || 1),
          servicePackageId: detail.servicePackageId,
          unit: detail.service?.unit || detail.unit || '',
          jobs: normalizeServiceJobs(opportunityService?.jobs || detail.service?.serviceJobs || [])
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
          const costPrice = parseFloat(service.costAtSale) || 0;
          const configuredSellingPrice = parseFloat(service.sellingPrice) || 0;
          const minPrice = roundToTenThousands(costPrice / 0.8);
          const recommendedPrice = roundToTenThousands(costPrice / 0.6);

          return {
            serviceId: service.service?.id || service.id,
            serviceName: service.service?.name || service.name,
            quantity: service.quantity || 1,
            costPrice: costPrice,
            minPrice: minPrice,
            recommendedPrice: recommendedPrice,
            customPrice: configuredSellingPrice || recommendedPrice,
            selectedPrice: configuredSellingPrice || recommendedPrice,
            profitMargin: calculateProfitMargin(configuredSellingPrice || recommendedPrice, costPrice),
            packageName: 'STANDALONE',
            unit: service.service?.unit || service.unit || '',
            jobs: normalizeServiceJobs(service.jobs || service.service?.serviceJobs || [])
          };
        });

      // Package services
      const packageItems = (opportunity?.packages || []).flatMap(pkg =>
        (pkg.services || []).map(ps => {
          const costPrice = parseFloat(ps.costAtSale) || 0;
          const configuredSellingPrice = parseFloat(ps.sellingPrice) || 0;
          const minPrice = roundToTenThousands(costPrice / 0.8);
          const recommendedPrice = roundToTenThousands(costPrice / 0.6);

          return {
            serviceId: ps.serviceId,
            serviceName: ps.service?.name || ps.name || 'Dịch vụ trong gói',
            quantity: ps.quantity || 1,
            costPrice: costPrice,
            minPrice: minPrice,
            recommendedPrice: recommendedPrice,
            customPrice: configuredSellingPrice || recommendedPrice,
            selectedPrice: configuredSellingPrice || recommendedPrice,
            profitMargin: calculateProfitMargin(configuredSellingPrice || recommendedPrice, costPrice),
            packageName: pkg.name,
            packageQuantity: pkg.quantity || 1,
            norm: ps.quantity / (pkg.quantity || 1),
            servicePackageId: pkg.servicePackageId,
            unit: ps.service?.unit || ps.unit || '',
            jobs: normalizeServiceJobs(ps.jobs || ps.service?.serviceJobs || [])
          };
        })
      );

      setItems([...standaloneItems, ...packageItems]);
      setNotes('');
      setPriceType('custom');
    }
  }, [isOpen, !isEditMode, servicesData, opportunity?.packages]);

  const roundToTenThousands = (value) => {
    return Math.ceil(value / 10000) * 10000;
  };

  const calculateProfitMargin = (sellingPrice, costPrice) => {
    if (!sellingPrice || sellingPrice === 0) return 0;
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

  const toggleExpanded = (level, key) => {
    setExpandedRows(previous => ({
      ...previous,
      [level]: {
        ...previous[level],
        [key]: !previous[level][key]
      }
    }));
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

    const costPrice = parseFloat(service.costPrice) || 0;
    const minPrice = roundToTenThousands(costPrice / 0.8);
    const recommendedPrice = roundToTenThousands(costPrice / 0.6);

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
      ),
      unit: service.unit || '',
      jobs: normalizeServiceJobs(service.serviceJobs || [])
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
      const serviceId = ps.service?.id || ps.serviceId;
      const fullService = servicesById.get(String(serviceId)) || ps.service;
      const costPrice = parseFloat(fullService?.costPrice || ps.sellingPrice) || 0;
      const minPrice = roundToTenThousands(costPrice / 0.8);
      const recommendedPrice = roundToTenThousands(costPrice / 0.6);

      return {
        serviceId,
        serviceName: fullService?.name || ps.name || 'Dịch vụ trong gói',
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
        servicePackageId: template.id,
        unit: fullService?.unit || ps.unit || '',
        jobs: normalizeServiceJobs(fullService?.serviceJobs || ps.jobs || [])
      };
    });

    setItems([...items, ...packageItems]);
    setSelectedPackageId('');
    setShowAddPackage(false);
  };

  // Options for react-select (services not already in the list)
  const serviceOptions = useMemo(
    () => allServices
      .filter(s => !items.find(i => i.packageName === 'STANDALONE' && String(i.serviceId) === String(s.id)))
      .map(s => ({
        value: s.id,
        label: `${s.code ? `${s.code} - ` : ''}${s.name} - ${formatNumber(s.costPrice)} VNĐ`,
      })),
    [allServices, items]
  );

  // Options for react-select (packages not already in the list)
  const packageOptions = useMemo(
    () => packageTemplates
      .filter(t => !items.some(i => i.packageName === t.name))
      .map(t => ({
        value: t.id,
        label: `${t.code ? `${t.code} - ` : ''}${t.name} (${t.items?.length || 0} dịch vụ)`,
      })),
    [packageTemplates, items]
  );

  const totals = items.reduce((acc, item) => {
    const revenue = (item.selectedPrice || 0) * (item.quantity || 0);
    const cost = (item.costPrice || 0) * (item.quantity || 0);
    const vat = revenue * 0.08;
    const totalWithVat = revenue + vat;
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
      const jobs = item.jobs?.length
        ? item.jobs
        : normalizeServiceJobs(servicesById.get(String(item.serviceId))?.serviceJobs || []);
      if (key === 'STANDALONE') {
        standalone.push({ ...item, jobs, originalIndex: index });
      } else {
        const packageKey = String(item.servicePackageId || key);
        if (!packages[packageKey]) {
          packages[packageKey] = {
            key: packageKey,
            name: key,
            servicePackageId: item.servicePackageId,
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
        const itemTotalWithVat = itemRevenue + itemVat;

        packages[packageKey].costPrice += item.costPrice * (item.norm || 1);
        packages[packageKey].minPrice += item.minPrice * (item.norm || 1);
        packages[packageKey].recommendedPrice += item.recommendedPrice * (item.norm || 1);
        packages[packageKey].customPrice += item.customPrice * (item.norm || 1);
        packages[packageKey].selectedPrice += item.selectedPrice * (item.norm || 1);
        packages[packageKey].vat += itemVat;
        packages[packageKey].totalWithVat += itemTotalWithVat;
        packages[packageKey].items.push({ ...item, jobs, originalIndex: index });
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
      standalone: standalone
    };
  }, [items, servicesById]);

  const handleSubmit = () => {
    if (!isEditMode && incompleteAiJobs.length > 0) {
      const jobNames = [...new Set(incompleteAiJobs.map(job => job.name))].join(', ');
      toast.warning(`Vui lòng điền đầy đủ giá vốn job AI trước khi tạo báo giá: ${jobNames}`);
      return;
    }

    const submitData = {
      note: notes,
      totalAmount: totals.totalWithVat,
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
      // If editing a rejected quotation, reset status to DRAFT and clear the rejection reason (description)
      if (editQuotation?.status === 'REJECTED') {
        submitData.status = 'DRAFT';
        submitData.description = '';
      }
      onSubmit(submitData, editQuotation.id);
    } else {
      onSubmit(submitData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col">
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
          <div className="p-6 overflow-y-auto">

            {/* Items Table */}
            <div className="overflow-x-auto mb-6 border border-gray-100 rounded-xl shadow-sm">
              <table className="w-full border-collapse min-w-[1400px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[250px] sticky left-0 bg-gray-50 z-10 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Hạng mục</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-[100px]">Số lượng</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[120px]">Giá vốn</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[150px]">Giá bán tối thiểu</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[150px]">Giá bán đề xuất</th>
                    {priceType === 'custom' && (
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[150px]">Giá bán tùy chỉnh</th>
                    )}
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[150px]">Tỉ suất lợi nhuận</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[120px]">VAT (8%)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[150px]">Thành tiền</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-[100px]">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Render Packages */}
                  {displayGroups.packages.map((pkg) => {
                    const isPackageExpanded = Boolean(expandedRows.packages[pkg.key]);

                    return (
                    <Fragment key={`pkg-${pkg.key}`}>
                      <tr className="bg-blue-50/50 border-b border-blue-100 group">
                        <td className="px-4 py-2 text-sm font-bold text-blue-900 sticky left-0 bg-blue-50/50 group-hover:bg-blue-100 z-10 border-r border-blue-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExpanded('packages', pkg.key)}
                              className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-100"
                              aria-expanded={isPackageExpanded}
                              title={isPackageExpanded ? 'Thu gọn dịch vụ' : 'Xem dịch vụ trong gói'}
                            >
                              {isPackageExpanded
                                ? <ChevronUp className="h-4 w-4" />
                                : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">Gói</span>
                            {pkg.name}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              min="1"
                              value={pkg.quantity}
                              onChange={(e) => handleQuantityChange(pkg.name, e.target.value)}
                              className="w-10 py-1 text-center border-2 border-blue-200 rounded text-sm font-bold text-blue-900 bg-white"
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
                          <td className="px-4 py-2 text-right text-sm font-bold text-blue-900">
                            {formatNumber(pkg.customPrice)}
                          </td>
                        )}
                        <td className={`px-4 py-2 text-right text-sm font-black ${pkg.profitMargin < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {pkg.profitMargin.toFixed(0)}%
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
                      {isPackageExpanded && pkg.items.map((item) => {
                        const serviceKey = `package:${pkg.key}:${item.serviceId}:${item.originalIndex}`;
                        const isServiceExpanded = Boolean(expandedRows.services[serviceKey]);
                        const hasJobs = item.jobs?.length > 0;

                        return (
                        <Fragment key={serviceKey}>
                        <tr className="border-b border-gray-50 bg-blue-50/10 group hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-2 text-sm text-gray-600 pl-10 sticky left-0 bg-white group-hover:bg-blue-50 z-10 border-r border-blue-50">
                            <div className="flex items-center gap-2">
                              {hasJobs ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded('services', serviceKey)}
                                  className="rounded p-1 text-indigo-500 transition-colors hover:bg-indigo-50"
                                  aria-expanded={isServiceExpanded}
                                  title={isServiceExpanded ? 'Thu gọn hạng mục' : 'Xem hạng mục của dịch vụ'}
                                >
                                  {isServiceExpanded
                                    ? <ChevronUp className="h-3.5 w-3.5" />
                                    : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              ) : <span className="w-5 text-center text-gray-300">•</span>}
                              <span className="italic">{item.serviceName}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-[11px] text-gray-500 font-medium whitespace-nowrap">
                            {Number(item.norm) % 1 === 0 ? item.norm : Number(item.norm).toFixed(0).replace(/\.?0+$/, '')} {item?.unit ? `${item.unit} / gói` : '/ gói'}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">
                            {formatNumber(item.costPrice)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">
                            {formatNumber(item.minPrice)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">
                            {formatNumber(item.recommendedPrice)}
                          </td>
                          {priceType === 'custom' && (
                            <td className="px-4 py-1.5">
                              <input
                                type="text"
                                value={formatNumber(item.customPrice)}
                                onChange={(e) => handleCustomPriceChange(item.originalIndex, e.target.value)}
                                className="w-full px-2 py-1 text-right border border-gray-300 rounded text-sm bg-white focus:border-blue-500 outline-none transition-all"
                              />
                            </td>
                          )}
                          <td className={`px-4 py-2 text-right text-sm font-medium ${item.profitMargin < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {item.profitMargin.toFixed(0)}%
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">
                            {formatNumber((item.selectedPrice * item.quantity) * 0.08)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                            {formatNumber((item.selectedPrice * item.quantity) * 1.08)}
                          </td>
                          <td className="px-4 py-2 text-center text-xs text-gray-300">
                          </td>
                        </tr>
                        {isServiceExpanded && item.jobs.map((job, jobIndex) => (
                          <tr key={`${serviceKey}:job:${job.id || jobIndex}`} className="border-b border-indigo-50 bg-indigo-50/20">
                            <td className="sticky left-0 z-10 border-r border-indigo-50 bg-indigo-50/20 py-2 pl-16 pr-4 text-xs text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="text-indigo-300">└</span>
                                <span>{job.name}</span>
                                {(job.isBriefVideo || !job.isQuotationItem) && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                    Không tính báo giá
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-[11px] text-gray-500 whitespace-nowrap">
                              {job.quantity} {job.unit}
                            </td>
                            <td
                              className="px-4 py-2 text-right text-xs text-gray-500"
                              title="Giá vốn hạng mục này đã được tính trong giá vốn dịch vụ"
                            >
                              {formatNumber(job.costAtSale)}
                            </td>
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            {priceType === 'custom' && (
                              <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            )}
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            <td className="px-4 py-2"></td>
                          </tr>
                        ))}
                        </Fragment>
                        );
                      })}
                    </Fragment>
                    );
                  })}

                  {/* Render Standalone Services */}
                  {displayGroups.standalone.length > 0 && (
                    <>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <td colSpan={priceType === 'custom' ? 10 : 9} className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest sticky left-0 z-10 border-r border-gray-200">
                          Dịch vụ lẻ
                        </td>
                      </tr>
                      {displayGroups.standalone.map((item) => {
                        const serviceKey = `standalone:${item.serviceId}:${item.originalIndex}`;
                        const isServiceExpanded = Boolean(expandedRows.services[serviceKey]);
                        const hasJobs = item.jobs?.length > 0;

                        return (
                        <Fragment key={serviceKey}>
                        <tr className="border-b border-gray-100 hover:bg-gray-50 group">
                          <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center gap-2">
                              {hasJobs ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded('services', serviceKey)}
                                  className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100"
                                  aria-expanded={isServiceExpanded}
                                  title={isServiceExpanded ? 'Thu gọn hạng mục' : 'Xem hạng mục của dịch vụ'}
                                >
                                  {isServiceExpanded
                                    ? <ChevronUp className="h-3.5 w-3.5" />
                                    : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              ) : <span className="w-5 text-center text-gray-300">•</span>}
                              <span>{item.serviceName}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <div className="flex items-center justify-center gap-1 leading-tight">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleStandaloneQuantityChange(item.originalIndex, e.target.value)}
                                className="w-10 py-1 text-center border border-gray-300 rounded text-sm"
                              />
                              {item.unit && (
                                <span className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">
                                  {item.unit}
                                </span>
                              )}
                            </div>
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
                            {item.profitMargin.toFixed(0)}%
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatNumber((item.selectedPrice * item.quantity) * 0.08)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {formatNumber((item.selectedPrice * item.quantity) * 1.08)}
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
                        {isServiceExpanded && item.jobs.map((job, jobIndex) => (
                          <tr key={`${serviceKey}:job:${job.id || jobIndex}`} className="border-b border-gray-100 bg-gray-50/80">
                            <td className="sticky left-0 z-10 border-r border-gray-100 bg-gray-50/80 py-2 pl-12 pr-4 text-xs text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-300">└</span>
                                <span>{job.name}</span>
                                {(job.isBriefVideo || !job.isQuotationItem) && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                    Không tính báo giá
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-[11px] text-gray-500 whitespace-nowrap">
                              {job.quantity} {job.unit}
                            </td>
                            <td
                              className="px-4 py-2 text-right text-xs text-gray-500"
                              title="Giá vốn hạng mục này đã được tính trong giá vốn dịch vụ"
                            >
                              {formatNumber(job.costAtSale)}
                            </td>
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            {priceType === 'custom' && (
                              <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            )}
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
                            <td className="px-4 py-2"></td>
                          </tr>
                        ))}
                        </Fragment>
                        );
                      })}
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
                    <Select
                      options={serviceOptions}
                      value={serviceOptions.find(o => String(o.value) === String(selectedServiceId)) || null}
                      onChange={(opt) => setSelectedServiceId(opt ? String(opt.value) : '')}
                      placeholder="Tìm theo tên dịch vụ..."
                      noOptionsMessage={() => 'Không tìm thấy dịch vụ phù hợp'}
                      isClearable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={selectStyles('#fb923c')}
                    />
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
                    <Select
                      options={packageOptions}
                      value={packageOptions.find(o => String(o.value) === String(selectedPackageId)) || null}
                      onChange={(opt) => setSelectedPackageId(opt ? String(opt.value) : '')}
                      placeholder="Tìm theo tên gói..."
                      noOptionsMessage={() => 'Không tìm thấy gói dịch vụ phù hợp'}
                      isClearable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={selectStyles('#6366f1')}
                    />
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
                  <p className="text-xl font-bold text-blue-900">{formatNumber(Math.round(totals.revenue))}</p>
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
                  <p className="text-xl font-bold text-blue-900">{formatNumber(Math.round(totals.cost))}</p>
                </div>
                <div>
                  <p className={`text-sm mb-1 ${totals.revenue - totals.cost < 0 ? 'text-red-700' : 'text-blue-700'}`}>Tổng lợi nhuận:</p>
                  <p className={`text-xl font-bold ${totals.revenue - totals.cost < 0 ? 'text-red-900' : 'text-blue-900'}`}>{formatNumber(Math.round(totals.revenue - totals.cost))}</p>
                </div>
                <div>
                  <p className={`text-sm mb-1 ${overallProfitMargin < 0 ? 'text-red-700' : 'text-blue-700'
                    }`}>Tỉ suất lợi nhuận:</p>
                  <p className={`text-xl font-bold ${overallProfitMargin < 0 ? 'text-red-900' : 'text-blue-900'
                    }`}>{Math.round(overallProfitMargin)}%</p>
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
                disabled={items.length === 0 || isSubmitting || (!isEditMode && incompleteAiJobs.length > 0)}
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
