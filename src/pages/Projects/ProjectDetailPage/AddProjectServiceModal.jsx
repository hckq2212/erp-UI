import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  FileText,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetServicesQuery } from '../../../api/services';
import { useGetServicePackagesQuery } from '../../../api/servicePackages';
import { useCreateProjectServiceAddendumMutation } from '../../../api/projects';
import { formatNumber } from '../../../utils/format';
import { getInitialCustomPrice, toServiceAddendumPricingItem, validateNewServiceBudget } from '../../../utils/serviceAddendumBudget';
import { QuotationServicePricingTable, normalizeServiceJobs } from '../../../components/quotations/QuotationServicePricingTable';

const STANDALONE = 'STANDALONE';

const mapServiceJobs = (service, quantity = 1) =>
  (service.serviceJobs || []).map((serviceJob) => ({
    jobId: serviceJob.job?.id || serviceJob.jobId,
    jobName: serviceJob.job?.name || 'Công việc',
    quantity: Number(serviceJob.quantity || 1) * Number(quantity || 1),
    unit: serviceJob.job?.unit || '',
    unitCost: Number(serviceJob.job?.costPrice || 0),
    cost: Number(serviceJob.job?.costPrice || 0) *
      Number(serviceJob.quantity || 1) *
      Number(quantity || 1),
    isOutput: serviceJob.isOutput,
  }));

const createRowFromService = (service, overrides = {}) => {
  const norm = Number(overrides.norm || 1);
  const packageQuantity = Number(overrides.packageQuantity || 1);
  const quantity = Number(overrides.quantity || norm * packageQuantity || 1);

  return {
    key: `${overrides.packageKey || STANDALONE}-${service.id}-${Date.now()}-${Math.random()}`,
    serviceId: service.id,
    serviceName: service.name,
    quantity,
    norm,
    sellingPrice: getInitialCustomPrice(service.costPrice),
    cost: Number(service.costPrice || 0),
    budget: 0,
    unit: service.unit || '',
    packageKey: overrides.packageKey,
    packageName: overrides.packageName || STANDALONE,
    packageQuantity,
    isPackageService: Boolean(overrides.packageName),
    serviceJobs: service.serviceJobs || [],
    jobs: mapServiceJobs(service, quantity),
    description: service.description,
  };
};

export const AddProjectServiceModal = ({ isOpen, onClose, project, isClosed: propIsClosed, isOnHold: propIsOnHold }) => {
  const isClosed = propIsClosed ?? ['COMPLETED', 'CANCELLED'].includes(project?.status);
  const isOnHold = propIsOnHold ?? (project?.status === 'ON_HOLD' || Boolean(project?.isOnHold));
  const { data: servicesResponse, isFetching: isFetchingServices, error: servicesError } = useGetServicesQuery({}, { skip: !isOpen });
  const { data: packageTemplates = [], isFetching: isFetchingPackages } = useGetServicePackagesQuery({}, { skip: !isOpen });
  const [createProjectServiceAddendum, { isLoading: isCreating }] = useCreateProjectServiceAddendumMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('');

  const allServices = useMemo(
    () => (Array.isArray(servicesResponse) ? servicesResponse : (servicesResponse?.data || [])),
    [servicesResponse]
  );

  useEffect(() => {
    if (!isOpen) return;
    setName(`${project?.name || 'Dự án'} - Phụ lục bổ sung dịch vụ`);
    setDescription('');
    setItems([]);
    setShowAddService(false);
    setSelectedServiceId('');
    setShowAddPackage(false);
    setSelectedPackageId('');
  }, [isOpen, project?.name]);

  const servicesById = useMemo(() => new Map(allServices.map((service) => [String(service.id), service])), [allServices]);
  const asPricingItem = (item) => ({ ...toServiceAddendumPricingItem(item), jobs: normalizeServiceJobs(item.serviceJobs || []) });
  const pricingItems = items.map(asPricingItem);
  const setPricingItems = (update) => {
    if (isCreating) return;
    setItems((previous) => {
      const next = typeof update === 'function' ? update(previous.map(asPricingItem)) : update;
      return (next || previous).map((item) => ({
        ...item, cost: item.costPrice ?? item.cost, sellingPrice: item.selectedPrice ?? item.sellingPrice,
        jobs: mapServiceJobs(item, item.quantity),
      }));
    });
  };

  const availableServices = allServices.filter(
    (service) => !items.some((item) => item.packageName === STANDALONE && String(item.serviceId) === String(service.id))
  );

  const isFetching = isFetchingServices || isFetchingPackages;

  const handleAddService = () => {
    if (!selectedServiceId) return;
    const service = allServices.find((item) => String(item.id) === String(selectedServiceId));
    if (!service) return;

    setItems((prev) => [...prev, createRowFromService(service)]);
    setSelectedServiceId('');
    setShowAddService(false);
  };

  const handleAddPackage = () => {
    if (!selectedPackageId) return;
    const templatePackage = packageTemplates.find((item) => String(item.id) === String(selectedPackageId));
    if (!templatePackage) return;

    if (items.some((item) => item.packageName === templatePackage.name)) {
      toast.error(`Gói "${templatePackage.name}" đã có trong phụ lục`);
      return;
    }

    const newPackageKey = `new-package-${templatePackage.id}-${Date.now()}`;
    const packageItems = (templatePackage.items || [])
      .filter((packageItem) => packageItem.service || packageItem.serviceId)
      .map((packageItem) => {
        const service = allServices.find((svc) => (
          String(svc.id) === String(packageItem.serviceId || packageItem.service?.id)
        )) ||
          packageItem.service ||
          {};
        return createRowFromService(service, {
          packageKey: newPackageKey,
          packageName: templatePackage.name,
          packageQuantity: 1,
          quantity: Number(packageItem.defaultQuantity || 1),
          norm: Number(packageItem.defaultQuantity || 1),
        });
      })
      .filter((item) => item.serviceId);

    if (packageItems.length === 0) {
      toast.error('Gói dịch vụ chưa có hạng mục');
      return;
    }

    setItems((prev) => [...prev, ...packageItems]);
    setSelectedPackageId('');
    setShowAddPackage(false);
  };

  const validateItems = () => {
    if (items.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return false;
    }

    for (const item of items) {
      const budgetError = validateNewServiceBudget(item, allServices.find((service) => String(service.id) === String(item.serviceId)));
      if (budgetError) { toast.error(budgetError); return false; }
      const quantity = Number(item.quantity);
      const sellingPrice = Number(item.sellingPrice);

      if (!item.serviceId) {
        toast.error('Dịch vụ bổ sung không hợp lệ');
        return false;
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        toast.error('Số lượng dịch vụ phải là số nguyên dương');
        return false;
      }

      if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
        toast.error('Đơn giá dịch vụ không hợp lệ');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (isCreating) return;
    if (isClosed) {
      toast.warning('Dự án đã đóng — không thể thêm dịch vụ');
      return;
    }
    if (isOnHold) {
      toast.warning('Dự án đang tạm dừng — không thể thêm dịch vụ');
      return;
    }
    if (!validateItems()) return;

    try {
      await createProjectServiceAddendum({
        projectId: project.id,
        name,
        description,
        items: items.map((item) => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          quantity: Number(item.quantity),
          packageKey: item.packageKey,
          packageName: item.packageName !== STANDALONE ? item.packageName : undefined,
          packageQuantity: item.packageQuantity,
          isPackageService: item.packageName !== STANDALONE,
          sellingPrice: Number(item.sellingPrice || 0),
          cost: Number(item.cost || 0),
          budget: Number(item.budget || 0),
        })),
      }).unwrap();
      toast.success('Đã tạo phụ lục bổ sung dịch vụ');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo phụ lục bổ sung dịch vụ');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex max-h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              title="Đóng"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200/80 bg-orange-50 text-orange-600 shadow-2xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Thêm dịch vụ vào dự án</h3>
              <p className="text-xs text-slate-500">Tạo phụ lục hợp đồng bổ sung dịch vụ và ngân sách</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isOnHold && (
          <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
            ⚠️ Dự án đang tạm dừng — chức năng thêm dịch vụ tạm khóa.
          </div>
        )}
        {isClosed && (
          <div className="mx-6 mt-4 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700">
            🔒 Dự án đã đóng — không thể thêm dịch vụ.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {isFetching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : servicesError ? (
            <div className="py-12 text-center">
              <p className="text-red-500">Có lỗi xảy ra khi tải danh sách dịch vụ</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 shadow-2xs">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <span>Tên phụ lục bổ sung</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      placeholder="Nhập tên phụ lục bổ sung dịch vụ..."
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Ghi chú phụ lục
                    </label>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      placeholder="Nhập ghi chú cho phụ lục (không bắt buộc)..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">Chi tiết dịch vụ</h4>
                    {items.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        {items.length} hạng mục
                      </span>
                    )}
                  </div>
                </div>

                <QuotationServicePricingTable
                  items={pricingItems} setItems={setPricingItems}
                  priceType="custom" customOnly servicesById={servicesById}
                  mode="edit" disabled={isCreating || isClosed || isOnHold}
                  emptyMessage="Chưa chọn dịch vụ bổ sung."
                />
              </div>

              <div className="space-y-3">
                {!showAddService && !showAddPackage ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowAddService(true); setShowAddPackage(false); }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:border-orange-300 hover:bg-orange-50/40 hover:text-orange-600 active:scale-95"
                    >
                      <Plus className="h-4 w-4 text-orange-500" />
                      <span>Thêm dịch vụ lẻ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowAddPackage(true); setShowAddService(false); }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:border-orange-300 hover:bg-orange-50/40 hover:text-orange-600 active:scale-95"
                    >
                      <Briefcase className="h-4 w-4 text-orange-500" />
                      <span>Thêm gói dịch vụ mẫu</span>
                    </button>
                  </div>
                ) : null}

                {showAddService && (
                  <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50/30 p-4 shadow-xs sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Chọn dịch vụ lẻ
                      </label>
                      <select
                        value={selectedServiceId}
                        onChange={(event) => setSelectedServiceId(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="">-- Chọn dịch vụ --</option>
                        {availableServices.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} - {formatNumber(service.costPrice)} VNĐ
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddService}
                        disabled={!selectedServiceId}
                        className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-orange-300"
                      >
                        Thêm vào phụ lục
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddService(false);
                          setSelectedServiceId('');
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {showAddPackage && (
                  <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50/30 p-4 shadow-xs sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Chọn gói dịch vụ mẫu
                      </label>
                      <select
                        value={selectedPackageId}
                        onChange={(event) => setSelectedPackageId(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="">-- Chọn gói mẫu --</option>
                        {packageTemplates
                          .filter((templatePackage) => !items.some((item) => item.packageName === templatePackage.name))
                          .map((templatePackage) => (
                            <option key={templatePackage.id} value={templatePackage.id}>
                              {templatePackage.name} ({templatePackage.items?.length || 0} dịch vụ)
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddPackage}
                        disabled={!selectedPackageId}
                        className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-orange-300"
                      >
                        Áp dụng gói mẫu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddPackage(false);
                          setSelectedPackageId('');
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={items.length === 0 || isCreating || isFetching || isClosed || isOnHold}
            className="flex-[2] rounded-xl bg-orange-500 px-5 py-3 font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-98 disabled:cursor-not-allowed disabled:bg-orange-300 disabled:shadow-none"
          >
            <span className="flex items-center justify-center gap-2">
              {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              {isCreating ? 'Đang xử lý...' : 'Tạo phụ lục bổ sung dịch vụ'}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-98"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
