import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetServicesQuery } from '../../../api/services';
import { useGetServicePackagesQuery } from '../../../api/servicePackages';
import { useCreateProjectServiceAddendumMutation } from '../../../api/projects';
import { Modal } from '../../../components/ui/Modal';
import { formatNumber } from '../../../utils/format';

const createRowFromService = (service, overrides = {}) => ({
    key: `${overrides.packageKey || 'service'}-${service.id}-${Date.now()}-${Math.random()}`,
    serviceId: service.id,
    serviceName: service.name,
    quantity: overrides.quantity || 1,
    sellingPrice: Number(service.costPrice || 0),
    cost: Number(service.costPrice || 0),
    unit: service.unit || '',
    packageKey: overrides.packageKey,
    packageName: overrides.packageName,
    packageQuantity: overrides.packageQuantity,
    isPackageService: Boolean(overrides.packageName),
});

export const AddProjectServiceModal = ({ isOpen, onClose, project }) => {
    const { data: servicesResponse } = useGetServicesQuery({}, { skip: !isOpen });
    const { data: servicePackages = [] } = useGetServicePackagesQuery({}, { skip: !isOpen });
    const [createProjectServiceAddendum, { isLoading }] = useCreateProjectServiceAddendumMutation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [rows, setRows] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [packageQuantity, setPackageQuantity] = useState(1);

    const services = useMemo(
        () => (Array.isArray(servicesResponse) ? servicesResponse : (servicesResponse?.data || [])),
        [servicesResponse]
    );

    useEffect(() => {
        if (!isOpen) return;
        setName(`${project?.name || 'Dự án'} - Phụ lục bổ sung dịch vụ`);
        setDescription('');
        setRows([]);
        setSelectedServiceId('');
        setSelectedPackageId('');
        setPackageQuantity(1);
    }, [isOpen, project?.name]);

    const totals = useMemo(() => rows.reduce((acc, row) => {
        const quantity = Number(row.quantity || 1);
        acc.revenue += Number(row.sellingPrice || 0) * quantity;
        acc.cost += Number(row.cost || 0) * quantity;
        return acc;
    }, { revenue: 0, cost: 0 }), [rows]);

    const updateRow = (key, field, value) => {
        setRows((prev) => prev.map((row) => (
            row.key === key ? { ...row, [field]: value } : row
        )));
    };

    const removeRow = (key) => {
        setRows((prev) => prev.filter((row) => row.key !== key));
    };

    const handleAddService = () => {
        const service = services.find((item) => String(item.id) === String(selectedServiceId));
        if (!service) return;
        setRows((prev) => [...prev, createRowFromService(service)]);
        setSelectedServiceId('');
    };

    const handleAddPackage = () => {
        const quantity = Number(packageQuantity || 1);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            toast.error('Số lượng gói phải là số nguyên dương');
            return;
        }

        const servicePackage = servicePackages.find((item) => String(item.id) === String(selectedPackageId));
        if (!servicePackage) return;

        const packageKey = `package-${servicePackage.id}-${Date.now()}`;
        const packageRows = (servicePackage.items || [])
            .filter((item) => item.service || item.serviceId)
            .map((item) => {
                const service = item.service || services.find((svc) => String(svc.id) === String(item.serviceId)) || {};
                return createRowFromService(service, {
                    packageKey,
                    packageName: servicePackage.name,
                    packageQuantity: quantity,
                    quantity: Number(item.defaultQuantity || 1) * quantity,
                });
            });

        if (packageRows.length === 0) {
            toast.error('Gói dịch vụ chưa có hạng mục');
            return;
        }

        setRows((prev) => [...prev, ...packageRows]);
        setSelectedPackageId('');
        setPackageQuantity(1);
    };

    const validateRows = () => {
        if (rows.length === 0) {
            toast.error('Vui lòng chọn ít nhất một dịch vụ');
            return false;
        }

        for (const row of rows) {
            const quantity = Number(row.quantity);
            const sellingPrice = Number(row.sellingPrice);
            if (!row.serviceId) {
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateRows()) return;

        try {
            await createProjectServiceAddendum({
                projectId: project.id,
                name,
                description,
                items: rows.map((row) => ({
                    serviceId: row.serviceId,
                    serviceName: row.serviceName,
                    quantity: Number(row.quantity),
                    packageKey: row.packageKey,
                    packageName: row.packageName,
                    packageQuantity: row.packageQuantity,
                    isPackageService: row.isPackageService,
                    sellingPrice: Number(row.sellingPrice || 0),
                    cost: Number(row.cost || 0),
                })),
            }).unwrap();
            toast.success('Đã tạo phụ lục bổ sung dịch vụ');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo phụ lục bổ sung dịch vụ');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Thêm dịch vụ"
            className="max-w-5xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                            Tên phụ lục
                        </label>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Phụ lục bổ sung dịch vụ"
                        />
                    </div>
                    <div className="rounded-lg bg-blue-50 px-4 py-3 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Tổng giá trị</p>
                        <p className="text-lg font-black text-blue-700">{formatNumber(totals.revenue)} VNĐ</p>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                        Ghi chú
                    </label>
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Nhập ghi chú cho phụ lục..."
                    />
                </div>

                <div className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 lg:grid-cols-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                Dịch vụ lẻ
                            </label>
                            <select
                                value={selectedServiceId}
                                onChange={(event) => setSelectedServiceId(event.target.value)}
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="">Chọn dịch vụ</option>
                                {services.map((service) => (
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
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                Gói dịch vụ
                            </label>
                            <select
                                value={selectedPackageId}
                                onChange={(event) => setSelectedPackageId(event.target.value)}
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                            >
                                <option value="">Chọn gói</option>
                                {servicePackages.map((servicePackage) => (
                                    <option key={servicePackage.id} value={servicePackage.id}>
                                        {servicePackage.name} ({servicePackage.items?.length || 0} dịch vụ)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                SL gói
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={packageQuantity}
                                onChange={(event) => setPackageQuantity(event.target.value)}
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-center text-sm outline-none focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddPackage}
                            disabled={!selectedPackageId}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Briefcase className="h-4 w-4" />
                            Áp dụng
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Dịch vụ</th>
                                <th className="px-4 py-3 text-center font-semibold">Số lượng</th>
                                <th className="px-4 py-3 text-right font-semibold">Đơn giá</th>
                                <th className="px-4 py-3 text-right font-semibold">Thành tiền</th>
                                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row) => (
                                <tr key={row.key} className={row.isPackageService ? 'bg-indigo-50/20' : 'bg-white'}>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900">{row.serviceName}</div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            {row.packageName ? `Gói: ${row.packageName}` : 'Dịch vụ lẻ'}
                                            {row.unit ? ` - ${row.unit}` : ''}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={row.quantity}
                                            onChange={(event) => updateRow(row.key, 'quantity', event.target.value)}
                                            className="h-10 w-24 rounded-lg border border-gray-200 px-3 text-center text-sm outline-none focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={row.sellingPrice}
                                            onChange={(event) => updateRow(row.key, 'sellingPrice', event.target.value)}
                                            className="h-10 w-36 rounded-lg border border-gray-200 px-3 text-right text-sm outline-none focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                                        {formatNumber(Number(row.sellingPrice || 0) * Number(row.quantity || 1))} VNĐ
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(row.key)}
                                            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm italic text-gray-400">
                                        Chưa chọn dịch vụ bổ sung.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-11 rounded-lg border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || rows.length === 0}
                        className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? 'Đang xử lý...' : 'Tạo phụ lục bổ sung dịch vụ'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
