import { useEffect, useState } from 'react';
import { Ban, Briefcase, CheckCircle2, ExternalLink, Package, RotateCcw, Save, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatNumber, parseNumber } from '../../../utils/format';
import { useUpdateOpportunityServiceMutation } from '../../../api/opportunityService';
import { useApproveByCustomerMutation, useMarkCustomerNotPurchasedMutation, useRequestReworkMutation } from '../../../api/tasks';
import { ReworkTaskModal } from '../../../components/tasks/ReworkTaskModal';

const normalizeMoneyInput = value => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/^0+(?=\d)/, '');
};

const JobPrices = ({ service, opportunityId, canEditPrices, canHandleDemo }) => {
    const [drafts, setDrafts] = useState({});
    const [reworkTask, setReworkTask] = useState(null);
    const [updateOpportunityService, { isLoading }] = useUpdateOpportunityServiceMutation();
    const [approveByCustomer, { isLoading: isApproving }] = useApproveByCustomerMutation();
    const [markCustomerNotPurchased, { isLoading: isRejecting }] = useMarkCustomerNotPurchasedMutation();
    const [requestRework, { isLoading: isRequestingRework }] = useRequestReworkMutation();
    const visibleJobs = (service.jobs || []).filter(job =>
        job.isBriefVideo || Number(job.job?.costPrice || 0) <= 0
    );
    const editableJobs = visibleJobs.filter(job =>
        !job.isBriefVideo && job.isQuotationItem && Number(job.job?.costPrice || 0) <= 0
    );
    const demoTasks = (service.jobs || [])
        .filter(job => job.isBriefVideo)
        .flatMap(job => job.tasks || []);
    const requiresCustomerApproval = demoTasks.length > 0;
    const customerApproved = demoTasks.some(task => task.customerDecision === 'APPROVED');
    const canEnterCost = canEditPrices && (!requiresCustomerApproval || customerApproved);

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
        if (!canEnterCost) {
            toast.info(requiresCustomerApproval
                ? 'Chỉ được nhập giá vốn sau khi BD xác nhận khách hàng duyệt mua'
                : 'Vui lòng chọn khách hàng trước khi điền giá vốn dịch vụ');
            return;
        }

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

    const decide = async (task, decision) => {
        if (decision === 'NOT_PURCHASED' && !window.confirm('Xác nhận khách hàng không mua video AI này?')) return;
        try {
            const mutation = decision === 'APPROVED' ? approveByCustomer : markCustomerNotPurchased;
            await mutation({ id: task.id, opportunityId }).unwrap();
            toast.success(decision === 'APPROVED'
                ? 'Đã ghi nhận khách hàng duyệt mua. Bạn có thể nhập giá vốn để bán.'
                : 'Đã ghi nhận khách hàng không mua.');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể cập nhật quyết định của khách hàng');
        }
    };

    const submitRework = async data => {
        try {
            await requestRework({ id: reworkTask.id, opportunityId, ...data }).unwrap();
            toast.success('Đã gửi yêu cầu làm lại video AI');
            setReworkTask(null);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể gửi yêu cầu làm lại');
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
                            {job.briefVideo && <p className="mt-1 whitespace-pre-wrap text-xs text-primary-900">Brief: {job.briefVideo}</p>}
                        </div>
                        {job.isBriefVideo && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">Không tính vào giá vốn báo giá</span>}
                    </div>
                    {canEditCost && canEnterCost ? (
                        <div>
                            <label className="text-xs text-gray-500">Giá vốn
                                <input
                                    name={`job-${job.id}-costAtSale`}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={formatNumber(drafts[job.id]?.costAtSale || '0')}
                                    onFocus={event => event.target.select()}
                                    onChange={event => changePrice(job.id, 'costAtSale', event.target.value)}
                                    disabled={!canEnterCost}
                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                />
                            </label>
                        </div>
                    ) : canEditCost && requiresCustomerApproval ? (
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                            Giá vốn chỉ được nhập sau khi BD chọn “Khách hàng duyệt”.
                        </p>
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
                                            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-900 hover:text-primary-800"
                                        >
                                            Mở video <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                    {task.result.note && <p className="mt-1 text-xs text-gray-500">{task.result.note}</p>}
                                    {task.customerDecision === 'APPROVED' && (
                                        <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">Khách hàng đã duyệt mua</p>
                                    )}
                                    {task.customerDecision === 'NOT_PURCHASED' && (
                                        <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-700">Khách hàng không mua</p>
                                    )}
                                    {task.status === 'INTERNAL_COMPLETED' && !task.customerDecision && canHandleDemo && (
                                        <div className="mt-3 grid gap-2 border-t border-emerald-100 pt-3 sm:grid-cols-3">
                                            <button type="button" onClick={() => decide(task, 'APPROVED')} disabled={isApproving || isRejecting} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                                                <CheckCircle2 className="h-4 w-4" /> Khách hàng duyệt
                                            </button>
                                            <button type="button" onClick={() => decide(task, 'NOT_PURCHASED')} disabled={isApproving || isRejecting} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                                                <Ban className="h-4 w-4" /> Không mua
                                            </button>
                                            <button type="button" onClick={() => setReworkTask(task)} disabled={isApproving || isRejecting} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-300 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 disabled:opacity-50">
                                                <RotateCcw className="h-4 w-4" /> Yêu cầu làm lại
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                );
            })}
            {editableJobs.length > 0 && canEnterCost && (
                <div className="flex justify-end">
                    <button type="button" onClick={save} disabled={isLoading || !canEnterCost} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
                        <Save className="h-4 w-4" /> {isLoading ? 'Đang lưu...' : 'Lưu giá vốn hạng mục'}
                    </button>
                </div>
            )}
            <ReworkTaskModal
                isOpen={Boolean(reworkTask)}
                onClose={() => setReworkTask(null)}
                onSubmit={submitRework}
                isLoading={isRequestingRework}
                taskName={reworkTask?.nickname || reworkTask?.name || 'Video AI demo'}
            />
        </div>
    );
};

const ServiceCard = ({ service, opportunityId, canEditPrices, canHandleDemo, packageQuantity = 1 }) => (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="flex items-center justify-between gap-3">
            <div>
                <p className="text-sm font-medium text-gray-900">{service.service?.name || service.name}</p>
                <p className="text-xs text-gray-500">Số lượng: {Number(service.quantity || 1) / Number(packageQuantity || 1)} {service.service?.unit || service.unit}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
                <p>Giá vốn: <strong>{formatNumber(Number(service.costAtSale || 0) + Number(service.budget || 0))} VNĐ</strong></p>
                <p>Ngân sách: <strong>{formatNumber(service.budget || 0)} VNĐ</strong></p>
            </div>
        </div>
        <JobPrices service={service} opportunityId={opportunityId} canEditPrices={canEditPrices} canHandleDemo={canHandleDemo} />
    </div>
);

export const OpportunityServicesInfo = ({ opportunity, currentUser, onAddCustomer }) => {
    const standaloneServices = opportunity.services?.filter(service => !service.opportunityPackageId) || [];
    const packages = opportunity.packages || [];
    const hasServices = packages.length > 0 || standaloneServices.length > 0;
    const canEditPrices = Boolean(opportunity.customer || opportunity.leadName?.trim());
    const isSalesOwner = ['BD', 'ADMIN_SALE'].includes(currentUser?.role) && currentUser?.id === opportunity.createdBy?.id;
    const canHandleDemo = isSalesOwner || ['ADMIN', 'BOD'].includes(currentUser?.role);

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-gray-900">Dịch vụ & Gói dịch vụ</h2>
            </div>
            {!canEditPrices && hasServices && (
                <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                    <p>Vui lòng chọn khách hàng trước khi điền giá vốn dịch vụ.</p>
                    <button
                        type="button"
                        onClick={onAddCustomer}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white hover:bg-amber-700"
                    >
                        <UserPlus className="h-4 w-4" />
                        Chọn khách hàng
                    </button>
                </div>
            )}
            <div className="space-y-6">
                {packages.map(pkg => (
                    <div key={pkg.id} className="rounded-xl border border-primary-100 bg-primary-50/40 p-4">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-primary p-2 text-white"><Briefcase className="h-4 w-4" /></div>
                            <h3 className="font-bold text-primary-900">Gói: {pkg.name} <span className="ml-2 text-primary-900">x{pkg.quantity || 1}</span></h3>
                        </div>
                        <div className="space-y-3">{pkg.services?.map(service => <ServiceCard key={service.id} service={service} opportunityId={opportunity.id} canEditPrices={canEditPrices} canHandleDemo={canHandleDemo} packageQuantity={pkg.quantity} />)}</div>
                    </div>
                ))}
                {standaloneServices.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-400">Dịch vụ lẻ</h3>
                        {standaloneServices.map(service => <ServiceCard key={service.id} service={service} opportunityId={opportunity.id} canEditPrices={canEditPrices} canHandleDemo={canHandleDemo} />)}
                    </div>
                )}
                {!packages.length && !standaloneServices.length && <p className="py-4 text-center italic text-gray-400">Chưa có dịch vụ nào được chọn</p>}
            </div>
        </div>
    );
};
