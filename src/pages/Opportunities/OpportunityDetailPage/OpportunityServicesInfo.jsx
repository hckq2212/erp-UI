import { useEffect, useState } from 'react';
import { Briefcase, Package, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatNumber, parseNumber } from '../../../utils/format';
import { useUpdateOpportunityServiceMutation } from '../../../api/opportunityService';

const JobPrices = ({ service, opportunityId }) => {
    const [drafts, setDrafts] = useState({});
    const [updateOpportunityService, { isLoading }] = useUpdateOpportunityServiceMutation();

    useEffect(() => {
        setDrafts(Object.fromEntries((service.jobs || []).map(job => [job.id, {
            costAtSale: String(job.costAtSale || 0),
            sellingPrice: String(job.sellingPrice || 0),
        }])));
    }, [service.jobs]);

    if (!service.jobs?.length) return null;

    const changePrice = (jobId, field, value) => {
        const raw = value.replace(/\D/g, '');
        setDrafts(previous => ({
            ...previous,
            [jobId]: { ...previous[jobId], [field]: raw },
        }));
    };

    const save = async () => {
        try {
            await updateOpportunityService({
                id: service.id,
                opportunityId,
                jobs: service.jobs.filter(job => job.isQuotationItem).map(job => ({
                    id: job.id,
                    costAtSale: parseNumber(drafts[job.id]?.costAtSale || '0'),
                    sellingPrice: parseNumber(drafts[job.id]?.sellingPrice || '0'),
                })),
            }).unwrap();
            toast.success('Đã cập nhật giá các hạng mục');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể cập nhật giá hạng mục');
        }
    };

    return (
        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
            {service.jobs.map(job => (
                <div key={job.id} className="rounded-lg border border-gray-100 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{job.name}</p>
                            {job.briefVideo && <p className="mt-1 whitespace-pre-wrap text-xs text-blue-700">Brief: {job.briefVideo}</p>}
                        </div>
                        {!job.isQuotationItem && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">Không tính báo giá</span>}
                    </div>
                    {job.isQuotationItem ? (
                        <div className="grid grid-cols-2 gap-3">
                            <label className="text-xs text-gray-500">Giá vốn
                                <input value={formatNumber(drafts[job.id]?.costAtSale || '0')} onChange={event => changePrice(job.id, 'costAtSale', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
                            </label>
                            <label className="text-xs text-gray-500">Giá bán
                                <input value={formatNumber(drafts[job.id]?.sellingPrice || '0')} onChange={event => changePrice(job.id, 'sellingPrice', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
                            </label>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600">Chi phí thực tế: <strong>{formatNumber(job.costAtSale)} VNĐ</strong></p>
                    )}
                </div>
            ))}
            <div className="flex justify-end">
                <button type="button" onClick={save} disabled={isLoading} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    <Save className="h-4 w-4" /> {isLoading ? 'Đang lưu...' : 'Lưu giá hạng mục'}
                </button>
            </div>
        </div>
    );
};

const ServiceCard = ({ service, opportunityId, packageQuantity = 1 }) => (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="flex items-center justify-between gap-3">
            <div>
                <p className="text-sm font-medium text-gray-900">{service.service?.name || service.name}</p>
                <p className="text-xs text-gray-500">Số lượng: {Number(service.quantity || 1) / Number(packageQuantity || 1)} {service.service?.unit || service.unit}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
                <p>Giá vốn: <strong>{formatNumber(service.costAtSale)} VNĐ</strong></p>
                <p>Giá bán: <strong className="text-indigo-700">{formatNumber(service.sellingPrice)} VNĐ</strong></p>
            </div>
        </div>
        <JobPrices service={service} opportunityId={opportunityId} />
    </div>
);

export const OpportunityServicesInfo = ({ opportunity }) => {
    const standaloneServices = opportunity.services?.filter(service => !service.opportunityPackageId) || [];
    const packages = opportunity.packages || [];

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Dịch vụ & Gói dịch vụ</h2>
            </div>
            <div className="space-y-6">
                {packages.map(pkg => (
                    <div key={pkg.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-blue-600 p-2 text-white"><Briefcase className="h-4 w-4" /></div>
                            <h3 className="font-bold text-blue-900">Gói: {pkg.name} <span className="ml-2 text-blue-500">x{pkg.quantity || 1}</span></h3>
                        </div>
                        <div className="space-y-3">{pkg.services?.map(service => <ServiceCard key={service.id} service={service} opportunityId={opportunity.id} packageQuantity={pkg.quantity} />)}</div>
                    </div>
                ))}
                {standaloneServices.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-400">Dịch vụ lẻ</h3>
                        {standaloneServices.map(service => <ServiceCard key={service.id} service={service} opportunityId={opportunity.id} />)}
                    </div>
                )}
                {!packages.length && !standaloneServices.length && <p className="py-4 text-center italic text-gray-400">Chưa có dịch vụ nào được chọn</p>}
            </div>
        </div>
    );
};
