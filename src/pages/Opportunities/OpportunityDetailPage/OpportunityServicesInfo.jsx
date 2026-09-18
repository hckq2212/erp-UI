import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, ExternalLink, Package, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatNumber, parseNumber } from '../../../utils/format';
import { useUpdateOpportunityServiceMutation } from '../../../api/opportunityService';

const normalizeMoneyInput = value => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/^0+(?=\d)/, '');
};

const JobPrices = ({ service, opportunityId }) => {
    const [drafts, setDrafts] = useState({});
    const [updateOpportunityService, { isLoading }] = useUpdateOpportunityServiceMutation();
    const visibleJobs = (service.jobs || []).filter(job =>
        job.isBriefVideo || Number(job.job?.costPrice || 0) <= 0
    );
    const editableJobs = visibleJobs.filter(job =>
        !job.isBriefVideo && job.isQuotationItem && Number(job.job?.costPrice || 0) <= 0
    );

    useEffect(() => {
        setDrafts(Object.fromEntries(editableJobs.map(job => [job.id, {
            costAtSale: String(Math.round(Number(job.costAtSale || 0))),
        }])));
    }, [service.jobs]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!visibleJobs.length) return null;

    const changePrice = (jobId, field, value) => {
        const raw = normalizeMoneyInput(value);
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
                jobs: editableJobs.map(job => ({
                    id: job.id,
                    costAtSale: parseNumber(drafts[job.id]?.costAtSale || '0'),
                })),
            }).unwrap();
            toast.success('Đã cập nhật giá vốn các hạng mục');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể cập nhật giá hạng mục');
        }
    };

    return (
        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
            {visibleJobs.map(job => {
                const canEditCost = editableJobs.some(item => item.id === job.id);
                const approvedResults = (job.tasks || []).filter(task =>
                    ['INTERNAL_COMPLETED', 'COMPLETED', 'ACCEPTED'].includes(task.status) && task.result?.url
                );

                return (
                <div key={job.id} className="rounded-lg border border-gray-100 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{job.name}</p>
                            {job.briefVideo && <p className="mt-1 whitespace-pre-wrap text-xs text-blue-700">Brief: {job.briefVideo}</p>}
                        </div>
                        {job.isBriefVideo && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">Không tính vào giá vốn báo giá</span>}
                    </div>
                    {canEditCost ? (
                        <div>
                            <label className="text-xs text-gray-500">Giá vốn
                                <input
                                    name={`job-${job.id}-costAtSale`}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={formatNumber(drafts[job.id]?.costAtSale || '0')}
                                    onFocus={event => event.target.select()}
                                    onChange={event => changePrice(job.id, 'costAtSale', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                                />
                            </label>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600">Chi phí thực tế: <strong>{formatNumber(job.costAtSale)} VNĐ</strong></p>
                    )}
                    {job.isBriefVideo && approvedResults.length > 0 && (
                        <div className="mt-3 space-y-3 border-t border-emerald-100 pt-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Kết quả Video AI demo đã được PM xác nhận
                            </div>
                            {approvedResults.map(task => (
                                <div key={task.id} className="overflow-hidden rounded-lg border border-emerald-100 bg-emerald-50/40 p-2.5">
                                    <video
                                        src={task.result.url}
                                        controls
                                        preload="metadata"
                                        className="max-h-72 w-full rounded-md bg-black"
                                    />
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                        <p className="truncate text-xs font-medium text-gray-700">
                                            {task.result.name || task.nickname || task.name || 'Video AI demo'}
                                        </p>
                                        <a
                                            href={task.result.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                        >
                                            Mở video <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                    {task.result.note && <p className="mt-1 text-xs text-gray-500">{task.result.note}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                );
            })}
            {editableJobs.length > 0 && (
                <div className="flex justify-end">
                    <button type="button" onClick={save} disabled={isLoading} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        <Save className="h-4 w-4" /> {isLoading ? 'Đang lưu...' : 'Lưu giá vốn hạng mục'}
                    </button>
                </div>
            )}
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
