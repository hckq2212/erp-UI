import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetServicesQuery } from '../../../api/services';
import { useGetServicePackagesQuery } from '../../../api/servicePackages';
import { useCreateProjectServiceAddendumMutation } from '../../../api/projects';
import { formatNumber } from '../../../utils/format';

const STANDALONE = 'STANDALONE';

const getItemTaskCount = (item) =>
  (item.jobs || []).reduce((sum, job) => sum + Number(job.quantity || 1), 0);

const mapServiceJobs = (service, quantity = 1) =>
  (service.serviceJobs || []).map((serviceJob) => ({
    jobId: serviceJob.job?.id || serviceJob.jobId,
    jobName: serviceJob.job?.name || 'Công việc',
    quantity: Number(serviceJob.quantity || 1) * Number(quantity || 1),
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
    sellingPrice: Number(service.costPrice || 0),
    cost: Number(service.costPrice || 0),
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

export const AddProjectServiceModal = ({ isOpen, onClose, project }) => {
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
  const [expandedPackages, setExpandedPackages] = useState({});
  const [expandedServices, setExpandedServices] = useState({});

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
    setExpandedPackages({});
    setExpandedServices({});
  }, [isOpen, project?.name]);

  const aggregatedItems = useMemo(() => {
    const packages = {};
    const standalone = [];

    items.forEach((item, index) => {
      const groupKey = item.packageKey || item.packageName || STANDALONE;
      const quantity = Number(item.quantity || 1);
      const enrichedItem = {
        ...item,
        originalIndex: index,
        lineRevenue: Number(item.sellingPrice || 0) * quantity,
        lineCost: Number(item.cost || 0) * quantity,
        taskCount: getItemTaskCount(item),
      };

      if (groupKey === STANDALONE) {
        standalone.push(enrichedItem);
        return;
      }

      if (!packages[groupKey]) {
        packages[groupKey] = {
          key: groupKey,
          packageName: item.packageName,
          quantity: Number(item.packageQuantity || 1),
          sellingPrice: 0,
          cost: 0,
          taskCount: 0,
          items: [],
        };
      }

      packages[groupKey].sellingPrice += enrichedItem.lineRevenue;
      packages[groupKey].cost += enrichedItem.lineCost;
      packages[groupKey].taskCount += enrichedItem.taskCount;
      packages[groupKey].items.push(enrichedItem);
    });

    return {
      packages: Object.values(packages),
      standalone,
    };
  }, [items]);

  const totals = useMemo(() => {
    const revenue = items.reduce((sum, item) => sum + Number(item.sellingPrice || 0) * Number(item.quantity || 1), 0);
    const cost = items.reduce((sum, item) => sum + Number(item.cost || 0) * Number(item.quantity || 1), 0);
    const taskCount = items.reduce((sum, item) => sum + getItemTaskCount(item), 0);
    return { revenue, cost, taskCount };
  }, [items]);

  const availableServices = allServices.filter(
    (service) => !items.some((item) => item.packageName === STANDALONE && String(item.serviceId) === String(service.id))
  );

  const isFetching = isFetchingServices || isFetchingPackages;

  const togglePackage = (packageKey) => {
    setExpandedPackages((prev) => ({
      ...prev,
      [packageKey]: !prev[packageKey],
    }));
  };

  const toggleService = (serviceKey) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceKey]: !prev[serviceKey],
    }));
  };

  const updateItemByIndex = (index, patch) => {
    setItems((prev) => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )));
  };

  const updateStandaloneQuantity = (index, value) => {
    const quantity = parseInt(value, 10) || 1;
    updateItemByIndex(index, {
      quantity,
      jobs: mapServiceJobs(items[index], quantity),
    });
  };

  const updatePackageQuantity = (packageKey, value) => {
    const packageQuantity = parseInt(value, 10) || 1;
    setItems((prev) => prev.map((item) => {
      if ((item.packageKey || item.packageName) !== packageKey) return item;
      const quantity = Number(item.norm || 1) * packageQuantity;
      return {
        ...item,
        packageQuantity,
        quantity,
        jobs: mapServiceJobs(item, quantity),
      };
    }));
  };

  const removePackage = (packageKey) => {
    setItems((prev) => prev.filter((item) => (item.packageKey || item.packageName) !== packageKey));
  };

  const removeService = (index) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

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
        const service = packageItem.service ||
          allServices.find((svc) => String(svc.id) === String(packageItem.serviceId)) ||
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
      <div className="relative flex max-h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-md border border-white/20 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <FileText className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Thêm dịch vụ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : servicesError ? (
            <div className="py-12 text-center">
              <p className="text-red-500">Có lỗi xảy ra khi tải danh sách dịch vụ</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl bg-purple-50 p-4">
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-purple-700">
                      Tên phụ lục
                    </label>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Phụ lục bổ sung dịch vụ"
                    />
                  </div>
                  <div className="rounded-lg bg-white px-4 py-3 text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-purple-500">Tổng giá trị</p>
                    <p className="text-lg font-black text-purple-900">{formatNumber(totals.revenue)} VNĐ</p>
                  </div>
                </div>

                <div className="mt-3 border-t border-purple-200 pt-3">
                  <p className="mb-1 text-sm font-medium text-gray-700">Ghi chú:</p>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-purple-100 bg-white px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Nhập ghi chú cho phụ lục..."
                  />
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-semibold text-gray-900">Chi tiết dịch vụ</h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-[980px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dịch vụ</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Số lượng</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Đơn giá</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá vốn</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Thành tiền</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedItems.packages.map((pkg, pIdx) => {
                        const packageKey = pkg.key || `pkg-${pIdx}-${pkg.packageName}`;
                        const isPackageExpanded = Boolean(expandedPackages[packageKey]);

                        return (
                          <Fragment key={packageKey}>
                            <tr
                              className="cursor-pointer border-b border-blue-100/50 bg-blue-50/30"
                              onClick={() => togglePackage(packageKey)}
                            >
                              <td className="px-4 py-3 text-sm font-bold text-blue-900">
                                <div className="flex items-center gap-2">
                                  {isPackageExpanded ? (
                                    <ChevronDown className="h-4 w-4 shrink-0 text-blue-700" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 shrink-0 text-blue-700" />
                                  )}
                                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                                    Gói
                                  </span>
                                  {pkg.packageName}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1 shadow-sm">
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={pkg.quantity}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={(event) => updatePackageQuantity(packageKey, event.target.value)}
                                    className="h-7 w-14 bg-transparent text-center text-sm font-bold text-blue-900 outline-none"
                                  />
                                  <span className="text-[10px] font-black uppercase tracking-tighter text-blue-400">
                                    Gói
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-blue-900">
                                {formatNumber(Math.round(pkg.sellingPrice))}
                              </td>
                              <td className="px-4 py-3 text-right text-sm italic text-blue-700">
                                {formatNumber(Math.round(pkg.cost))}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-black italic text-blue-900">
                                {formatNumber(Math.round(pkg.sellingPrice))}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removePackage(packageKey);
                                  }}
                                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-white hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>

                            {isPackageExpanded &&
                              pkg.items.map((item, iIdx) => {
                                const serviceKey = `${packageKey}-item-${iIdx}`;
                                const isServiceExpanded = Boolean(expandedServices[serviceKey]);

                                return (
                                  <Fragment key={serviceKey}>
                                    <tr
                                      className="cursor-pointer border-b border-gray-50/50 bg-blue-50/5 hover:bg-blue-50/20"
                                      onClick={() => toggleService(serviceKey)}
                                    >
                                      <td className="px-4 py-2 pl-10 text-sm italic text-gray-500">
                                        <div className="flex items-center gap-2">
                                          {isServiceExpanded ? (
                                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                          )}
                                          <span className="font-medium text-gray-600">{item.serviceName}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <span className="text-xs font-bold text-gray-500">
                                          {item.norm} {item.unit || ''} / Gói
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        <input
                                          type="number"
                                          min="0"
                                          step="1000"
                                          value={item.sellingPrice}
                                          onClick={(event) => event.stopPropagation()}
                                          onChange={(event) => updateItemByIndex(item.originalIndex, { sellingPrice: event.target.value })}
                                          className="h-8 w-32 rounded-lg border border-blue-100 bg-white px-2 text-right text-xs font-medium text-blue-900 outline-none focus:border-blue-500"
                                        />
                                      </td>
                                      <td className="px-4 py-2 text-right text-xs font-medium italic text-gray-400">
                                        {formatNumber(Math.round(item.lineCost))}
                                      </td>
                                      <td className="px-4 py-2 text-right text-xs font-bold text-gray-500">
                                        {formatNumber(Math.round(item.lineRevenue))}
                                      </td>
                                      <td />
                                    </tr>

                                    {isServiceExpanded && (
                                      <tr className="border-b border-gray-50/50 bg-blue-50/10">
                                        <td
                                          colSpan={6}
                                          className="px-4 py-3 pl-16 text-[11px] leading-relaxed text-gray-500"
                                        >
                                          <p className="whitespace-pre-wrap">{item.description || 'Không có mô tả'}</p>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                );
                              })}
                          </Fragment>
                        );
                      })}

                      {aggregatedItems.standalone.length > 0 && (
                        <>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <td
                              colSpan={6}
                              className="bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
                            >
                              Dịch vụ lẻ
                            </td>
                          </tr>

                          {aggregatedItems.standalone.map((item, idx) => {
                            const serviceKey = `standalone-${idx}`;
                            const isServiceExpanded = Boolean(expandedServices[serviceKey]);

                            return (
                              <Fragment key={serviceKey}>
                                <tr
                                  className="group cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                                  onClick={() => toggleService(serviceKey)}
                                >
                                  <td className="px-4 py-3 text-sm font-medium italic text-gray-900 transition-colors group-hover:text-purple-700">
                                    <div className="flex items-center gap-2">
                                      {isServiceExpanded ? (
                                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                      )}
                                      <span className="font-bold text-gray-900">{item.serviceName}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="inline-flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={item.quantity}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => updateStandaloneQuantity(item.originalIndex, event.target.value)}
                                        className="h-9 w-16 rounded-lg border border-gray-200 px-2 text-center text-sm outline-none focus:border-blue-500"
                                      />
                                      {item.unit && (
                                        <span className="text-[10px] font-bold uppercase text-gray-400">{item.unit}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1000"
                                      value={item.sellingPrice}
                                      onClick={(event) => event.stopPropagation()}
                                      onChange={(event) => updateItemByIndex(item.originalIndex, { sellingPrice: event.target.value })}
                                      className="h-9 w-36 rounded-lg border border-gray-200 px-3 text-right text-sm outline-none focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm italic text-gray-500">
                                    {formatNumber(Math.round(item.lineCost))}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-black italic text-gray-900">
                                    {formatNumber(Math.round(item.lineRevenue))}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        removeService(item.originalIndex);
                                      }}
                                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>

                                {isServiceExpanded && (
                                  <tr className="border-b border-gray-100 bg-gray-50/70">
                                    <td
                                      colSpan={6}
                                      className="px-4 py-3 pl-10 text-xs leading-relaxed text-gray-500"
                                    >
                                      <p className="whitespace-pre-wrap">{item.description || 'Không có mô tả'}</p>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </>
                      )}

                      {items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-sm italic text-gray-400">
                            Chưa chọn dịch vụ bổ sung.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan="4" className="px-4 py-3 text-right text-sm text-gray-700">
                          Tổng cộng:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-black text-gray-900">
                          {formatNumber(totals.revenue)} VNĐ
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                {!showAddService ? (
                  <button
                    type="button"
                    onClick={() => setShowAddService(true)}
                    className="flex items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Thêm dịch vụ</span>
                  </button>
                ) : (
                  <div className="flex items-end gap-3 rounded-xl border border-blue-100 bg-gray-50 p-4">
                    <div className="flex-1">
                      <label className="mb-2 block text-sm font-medium text-gray-700">Chọn dịch vụ lẻ</label>
                      <select
                        value={selectedServiceId}
                        onChange={(event) => setSelectedServiceId(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn dịch vụ --</option>
                        {availableServices.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} - {formatNumber(service.costPrice)} VNĐ
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddService}
                      disabled={!selectedServiceId}
                      className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddService(false);
                        setSelectedServiceId('');
                      }}
                      className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                  </div>
                )}

                {!showAddPackage ? (
                  <button
                    type="button"
                    onClick={() => setShowAddPackage(true)}
                    className="flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-indigo-600 transition-colors hover:bg-indigo-50"
                  >
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm font-medium">Thêm gói</span>
                  </button>
                ) : (
                  <div className="flex items-end gap-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                    <div className="flex-1">
                      <label className="mb-2 block text-sm font-medium text-indigo-900">Chọn gói dịch vụ mẫu</label>
                      <select
                        value={selectedPackageId}
                        onChange={(event) => setSelectedPackageId(event.target.value)}
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
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
                    <button
                      type="button"
                      onClick={handleAddPackage}
                      disabled={!selectedPackageId}
                      className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Áp dụng gói
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPackage(false);
                        setSelectedPackageId('');
                      }}
                      className="rounded-lg border border-indigo-200 px-4 py-2 font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={items.length === 0 || isCreating || isFetching}
            className="flex-[2] rounded-md bg-green-600 px-4 py-3 font-bold text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              {isCreating ? 'Đang xử lý...' : 'Tạo phụ lục bổ sung dịch vụ'}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md bg-white px-4 py-3 font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-100 active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
