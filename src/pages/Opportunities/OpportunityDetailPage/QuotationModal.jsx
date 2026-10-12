import { useEffect, useMemo, useState } from 'react';
import { Briefcase, FileText, Plus, X } from 'lucide-react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { useGetOpportunityServicesByOpportunityQuery } from '../../../api/opportunityService';
import { useGetServicesQuery } from '../../../api/services';
import { useGetServicePackagesQuery } from '../../../api/servicePackages';
import {
  calculateProfitMargin,
  getServicePricingTotals,
  normalizeServiceJobs,
  QuotationServicePricingTable,
  roundToTenThousands,
} from '../../../components/quotations/QuotationServicePricingTable';
import { formatNumber } from '../../../utils/format';

const selectStyles = (focusColor) => ({
  control: (base, state) => ({ ...base, minHeight: 42, borderRadius: 12, borderColor: state.isFocused ? focusColor : '#d1d5db', boxShadow: state.isFocused ? `0 0 0 1px ${focusColor}` : 'none', '&:hover': { borderColor: focusColor } }),
  indicatorSeparator: () => ({ display: 'none' }),
  menu: (base) => ({ ...base, zIndex: 9999, borderRadius: 12 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
});

const createPricingItem = (service, overrides = {}) => {
  const costPrice = Number(overrides.costPrice ?? service?.costPrice ?? 0);
  const budget = Number(overrides.budget ?? service?.budget ?? 0);
  const totalCost = costPrice + budget;
  const minPrice = roundToTenThousands(totalCost / 0.8);
  const recommendedPrice = roundToTenThousands(totalCost / 0.6);
  const customPrice = overrides.allowZeroSellingPrice
    ? Number(overrides.sellingPrice || 0)
    : Number(overrides.customPrice ?? recommendedPrice);
  const selectedPrice = overrides.priceType === 'minimum' ? minPrice : overrides.priceType === 'recommended' ? recommendedPrice : customPrice;
  return {
    key: overrides.key,
    id: overrides.id,
    isBudget: service?.isBudget === true,
    serviceId: overrides.serviceId || service?.id,
    opportunityServiceId: overrides.opportunityServiceId,
    serviceName: overrides.serviceName || service?.name || 'Dịch vụ',
    quantity: Number(overrides.quantity || 1),
    packageQuantity: Number(overrides.packageQuantity || 1),
    norm: Number(overrides.norm || 1),
    packageName: overrides.packageName || 'STANDALONE',
    packageKey: overrides.packageKey,
    servicePackageId: overrides.servicePackageId,
    unit: overrides.unit || service?.unit || '',
    costPrice,
    budget,
    minPrice,
    recommendedPrice,
    customPrice,
    selectedPrice,
    profitMargin: calculateProfitMargin(selectedPrice, costPrice, budget),
    jobs: normalizeServiceJobs(overrides.jobs || service?.serviceJobs || []),
  };
};

export const QuotationModal = ({ opportunity, isOpen, onClose, onSubmit, editQuotation = null, isSubmitting = false }) => {
  const [items, setItems] = useState([]);
  const [priceType, setPriceType] = useState('custom');
  const [notes, setNotes] = useState('');
  const [showAddService, setShowAddService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const isEditMode = Boolean(editQuotation);
  const { data: opportunityServices, isLoading } = useGetOpportunityServicesByOpportunityQuery(opportunity?.id, { skip: !isOpen || !opportunity?.id || isEditMode });
  const { data: servicesResponse } = useGetServicesQuery({}, { skip: !isOpen });
  const { data: packageTemplates = [] } = useGetServicePackagesQuery({}, { skip: !isOpen });
  const services = useMemo(() => Array.isArray(servicesResponse) ? servicesResponse : (servicesResponse?.data || []), [servicesResponse]);
  const servicesById = useMemo(() => new Map(services.map((service) => [String(service.id), service])), [services]);
  const incompleteAiJobs = useMemo(() => (opportunityServices || []).flatMap((service) => service.service?.isAI
    ? (service.jobs || []).filter((job) => job.isQuotationItem && !job.isBriefVideo && Number(job.costAtSale || 0) <= 0)
    : []), [opportunityServices]);

  useEffect(() => {
    if (!isOpen) {
      setShowAddService(false); setSelectedServiceId(''); setShowAddPackage(false); setSelectedPackageId('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isEditMode || !editQuotation) return;
    setNotes(editQuotation.note || '');
    setPriceType('custom');
    setItems((editQuotation.details || []).map((detail) => {
      const serviceId = detail.service?.id || detail.serviceId;
      const opportunityService = detail.packageName
        ? (opportunity?.packages || []).flatMap((pkg) => pkg.services || []).find((service) => String(service.service?.id || service.serviceId) === String(serviceId))
        : (opportunity?.services || []).find((service) => !service.opportunityPackageId && String(service.service?.id || service.serviceId) === String(serviceId));
      return createPricingItem(detail.service || {}, {
        id: detail.id, serviceId, serviceName: detail.service?.name, quantity: detail.quantity,
        opportunityServiceId: detail.opportunityServiceId || detail.opportunityService?.id,
        packageQuantity: detail.packageQuantity, norm: Number(detail.quantity || 1) / Number(detail.packageQuantity || 1),
        packageName: detail.packageName || 'STANDALONE', packageKey: detail.packageKey, servicePackageId: detail.servicePackageId,
        unit: detail.service?.unit || detail.unit, costPrice: detail.costAtSale, budget: detail.budget, sellingPrice: detail.sellingPrice,
        allowZeroSellingPrice: true, jobs: opportunityService?.jobs || detail.service?.serviceJobs || [],
      });
    }));
  }, [isOpen, isEditMode, editQuotation, opportunity]);

  useEffect(() => {
    if (!isOpen || isEditMode || !opportunityServices) return;
    const standalone = opportunityServices.filter((service) => !service.opportunityPackageId).map((service) => createPricingItem(service.service || service, {
      serviceId: service.service?.id || service.id, serviceName: service.service?.name || service.name,
      opportunityServiceId: service.id,
      quantity: service.quantity, unit: service.service?.unit || service.unit, costPrice: service.costAtSale,
      budget: service.budget, sellingPrice: service.sellingPrice, jobs: service.jobs || service.service?.serviceJobs || [],
    }));
    const packaged = (opportunity?.packages || []).flatMap((pkg) => (pkg.services || []).map((service) => {
      const norm = Number(service.quantity || 1) / Number(pkg.quantity || 1);
      const rawCost = Number(service.costAtSale || 0);
      const rawSelling = Number(service.sellingPrice || 0);
      return createPricingItem(service.service || service, {
        serviceId: service.serviceId, serviceName: service.service?.name || service.name,
        opportunityServiceId: service.id,
        quantity: service.quantity, packageQuantity: pkg.quantity, norm, packageName: pkg.name, packageKey: pkg.id,
        servicePackageId: pkg.servicePackageId, unit: service.service?.unit || service.unit,
        costPrice: norm > 1 && rawCost > 100000 ? Math.round(rawCost / norm) : rawCost,
        budget: service.budget,
        sellingPrice: norm > 1 && rawSelling > 100000 ? Math.round(rawSelling / norm) : rawSelling,
        jobs: service.jobs || service.service?.serviceJobs || [],
      });
    }));
    setItems([...standalone, ...packaged]); setNotes(''); setPriceType('custom');
  }, [isOpen, isEditMode, opportunityServices, opportunity?.packages]);

  const serviceOptions = useMemo(() => services.map((service) => ({ value: service.id, label: `${service.code ? `${service.code} - ` : ''}${service.name} - ${formatNumber(service.costPrice)} VNĐ` })), [services]);
  const packageOptions = useMemo(() => packageTemplates.map((pkg) => ({ value: pkg.id, label: `${pkg.name} (${pkg.items?.length || 0} dịch vụ)` })), [packageTemplates]);

  const handleAddService = () => {
    const service = servicesById.get(String(selectedServiceId));
    if (!service) return;
    setItems((previous) => [...previous, createPricingItem(service, { priceType })]);
    setSelectedServiceId(''); setShowAddService(false);
  };

  const handleAddPackage = () => {
    const template = packageTemplates.find((pkg) => String(pkg.id) === String(selectedPackageId));
    if (!template) return;
    const packageKey = `${template.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const packageItems = (template.items || []).map((packageItem) => {
      const serviceId = packageItem.service?.id || packageItem.serviceId;
      const service = servicesById.get(String(serviceId)) || packageItem.service || {};
      return createPricingItem(service, { serviceId, quantity: packageItem.defaultQuantity, norm: packageItem.defaultQuantity, packageName: template.name, packageKey, servicePackageId: template.id, priceType });
    });
    setItems((previous) => [...previous, ...packageItems]); setSelectedPackageId(''); setShowAddPackage(false);
  };

  const handleSubmit = () => {
    if (!isEditMode && incompleteAiJobs.length > 0) return toast.warning(`Vui lòng điền đầy đủ giá vốn job AI trước khi tạo báo giá: ${[...new Set(incompleteAiJobs.map((job) => job.name))].join(', ')}`);
    const payload = {
      note: notes,
      totalAmount: getServicePricingTotals(items).totalWithVat,
      details: items.map((item) => ({ id: item.id, serviceId: item.serviceId, opportunityServiceId: item.opportunityServiceId, quantity: item.quantity, sellingPrice: item.selectedPrice, costAtSale: item.costPrice, budget: Number(item.budget || 0), name: item.serviceName, packageQuantity: item.packageQuantity || 1, packageName: item.packageName !== 'STANDALONE' ? item.packageName : undefined, packageKey: item.packageName !== 'STANDALONE' ? item.packageKey : undefined, servicePackageId: item.servicePackageId, isPackageService: item.packageName !== 'STANDALONE' })),
    };
    if (isEditMode) {
      if (editQuotation.status === 'REJECTED') { payload.status = 'DRAFT'; payload.description = ''; }
      onSubmit(payload, editQuotation.id);
    } else onSubmit(payload);
  };

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="flex max-h-[90vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
    <div className="flex items-center justify-between border-b p-6"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /><h3 className="text-lg font-semibold">{isEditMode ? 'Chỉnh sửa báo giá' : `Báo giá ${opportunity?.name}`}</h3></div><button type="button" onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button></div>
    {isLoading ? <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /></div> : <div className="overflow-y-auto p-6">
      <QuotationServicePricingTable items={items} setItems={setItems} priceType={priceType} setPriceType={setPriceType} servicesById={servicesById} mode="edit" minimumItems={1}>
        <div className="mb-6 space-y-2">
          {!showAddService ? <button type="button" onClick={() => setShowAddService(true)} className="flex items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-blue-600"><Plus className="h-4 w-4" />Thêm dịch vụ</button> : <div className="flex items-end gap-3 rounded-xl bg-gray-50 p-4"><div className="flex-1"><label className="mb-2 block text-sm">Chọn dịch vụ lẻ</label><Select options={serviceOptions} value={serviceOptions.find((option) => String(option.value) === selectedServiceId) || null} onChange={(option) => setSelectedServiceId(option ? String(option.value) : '')} isClearable menuPortalTarget={document.body} styles={selectStyles('#fb923c')} /></div><button type="button" onClick={handleAddService} className="rounded-lg bg-blue-600 px-4 py-2 text-white">Thêm</button><button type="button" onClick={() => setShowAddService(false)} className="rounded-lg border px-4 py-2">Hủy</button></div>}
          {!showAddPackage ? <button type="button" onClick={() => setShowAddPackage(true)} className="flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-indigo-600"><Briefcase className="h-4 w-4" />Thêm gói</button> : <div className="flex items-end gap-3 rounded-xl bg-indigo-50 p-4"><div className="flex-1"><label className="mb-2 block text-sm">Chọn gói dịch vụ</label><Select options={packageOptions} value={packageOptions.find((option) => String(option.value) === selectedPackageId) || null} onChange={(option) => setSelectedPackageId(option ? String(option.value) : '')} isClearable menuPortalTarget={document.body} styles={selectStyles('#6366f1')} /></div><button type="button" onClick={handleAddPackage} className="rounded-lg bg-indigo-600 px-4 py-2 text-white">Áp dụng gói</button><button type="button" onClick={() => setShowAddPackage(false)} className="rounded-lg border px-4 py-2">Hủy</button></div>}
        </div>
      </QuotationServicePricingTable>
      <div className="mb-6"><label className="mb-2 block text-sm font-medium">Ghi chú</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2" /></div>
      <div className="flex gap-3 border-t pt-6"><button type="button" onClick={handleSubmit} disabled={items.length === 0 || isSubmitting || (!isEditMode && incompleteAiJobs.length > 0)} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{isSubmitting ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Tạo báo giá'}</button><button type="button" onClick={onClose} className="rounded-lg px-6 py-2">Đóng</button></div>
    </div>}
  </div></div>;
};
