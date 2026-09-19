import { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, XCircle, FileText, ExternalLink, MessageSquare, AlertCircle, Eye, LayoutList, Send, ChevronDown, ChevronUp, Clock, ShieldCheck } from 'lucide-react';
import { useGetAcceptanceRequestQuery, useProcessAcceptanceRequestMutation } from '../../api/acceptances';
import { toast } from 'react-toastify';
import { getFilePreviewUrl } from '../../utils/cloudinary';

export const AcceptanceReviewModal = ({ isOpen, onClose, request: initialRequest }) => {
    const { data: requestDetail } = useGetAcceptanceRequestQuery(initialRequest?.id, {
        skip: !isOpen || !initialRequest?.id,
    });
    const request = requestDetail || initialRequest;

    const isReadOnly = request?.status !== 'PENDING';

    const [processAcceptance, { isLoading: isSubmitting }] = useProcessAcceptanceRequestMutation();
    const [decisions, setDecisions] = useState({});
    const [expandedServices, setExpandedServices] = useState({});

    // Process and memoize service results data to avoid heavy recalculation and fix Hooks rules
    const processedServicesData = useMemo(() => {
        const data = {};
        if (request?.services) {
            request.services.forEach(service => {
                const uniqueResultsMap = new Map();
                const reversedResults = [...(service.results || [])].reverse();
                
                for (const res of reversedResults) {
                    if (!uniqueResultsMap.has(res.taskId)) {
                        uniqueResultsMap.set(res.taskId, res);
                    }
                }
                
                const uniqueResults = Array.from(uniqueResultsMap.values()).reverse();
                const approvedCount = uniqueResults.filter(res => res.status === 'APPROVED').length;
                const rejectedCount = uniqueResults.filter(res => res.status === 'REJECTED').length;
                
                // When request is not PENDING, or service is already rejected/completed, there are no pending results
                const isServiceClosed = isReadOnly || service.status === 'ACCEPTANCE_REJECTED' || service.status === 'COMPLETED';
                const pending = isServiceClosed 
                    ? [] 
                    : uniqueResults.filter(res => res.status !== 'APPROVED' && res.status !== 'REJECTED');
                
                data[service.id] = { 
                    allResults: uniqueResults,
                    pending, 
                    approvedCount,
                    rejectedCount,
                    isServiceClosed
                };
            });
        }
        return data;
    }, [request?.services, isReadOnly]);

    // Total pending results across all services — used to guard submit button
    const totalPendingResults = useMemo(() => {
        return Object.values(processedServicesData).reduce(
            (sum, svc) => sum + (svc.pending?.length || 0), 0
        );
    }, [processedServicesData]);

    // Check if user chose to reject all services
    const isAllRejected = useMemo(() => {
        if (!request?.services || request.services.length === 0) return false;
        const pendingServices = request.services.filter(s => {
            const svcData = processedServicesData[s.id];
            return !svcData?.isServiceClosed && (svcData?.pending?.length || 0) > 0;
        });
        if (pendingServices.length === 0) return false;
        return pendingServices.every(s => decisions[s.id]?.status === 'REJECTED');
    }, [request?.services, decisions, processedServicesData]);

    // Initialize decisions when request changes (only if in review mode)
    useEffect(() => {
        if (request?.services && !isReadOnly) {
            const initialDecisions = {};
            request.services.forEach(s => {
                const pendingResults = (s.results || []).filter(r => r.status !== 'APPROVED' && r.status !== 'REJECTED');
                initialDecisions[s.id] = {
                    status: 'APPROVED',
                    feedback: '',
                    resultDecisions: pendingResults.map(r => ({
                        taskId: r.taskId,
                        status: 'APPROVED',
                        feedback: ''
                    }))
                };
            });
            setDecisions(initialDecisions);
        }
    }, [request, isReadOnly]);

    if (!isOpen) return null;

    const toggleService = (serviceId) => {
        setExpandedServices(prev => ({ ...prev, [serviceId]: !prev[serviceId] }));
    };

    const handleServiceDecision = (serviceId, status) => {
        setDecisions(prev => {
            const current = prev[serviceId] || {};
            const currentFeedback = current.feedback || '';
            return {
                ...prev,
                [serviceId]: {
                    ...current,
                    status,
                    // If approving/rejecting whole service, auto-set all results
                    resultDecisions: (current.resultDecisions || []).map(rd => ({
                        ...rd,
                        status,
                        feedback: status === 'REJECTED' ? currentFeedback : ''
                    }))
                }
            };
        });
    };

    const handleServiceFeedback = (serviceId, feedback) => {
        setDecisions(prev => {
            const current = prev[serviceId] || {};
            return {
                ...prev,
                [serviceId]: {
                    ...current,
                    feedback,
                    resultDecisions: (current.resultDecisions || []).map(rd => ({
                        ...rd,
                        feedback: current.status === 'REJECTED' ? feedback : ''
                    }))
                }
            };
        });
    };

    const handleSubmit = async () => {
        // Guard: prevent submitting when there's nothing to review
        if (totalPendingResults === 0) {
            toast.info('Tất cả kết quả đã được duyệt, không cần xác nhận thêm.');
            return;
        }

        // Validation: Every rejected service must have feedback
        for (const [serviceId, data] of Object.entries(decisions)) {
            if (data.status === 'REJECTED' && !data.feedback?.trim()) {
                const svc = request.services?.find(s => s.id === serviceId);
                const svcName = svc?.service?.name || svc?.name || 'hạng mục';
                toast.error(`Vui lòng nhập lý do từ chối cho hạng mục "${svcName}"`);
                return;
            }
        }

        const payload = Object.entries(decisions).map(([serviceId, data]) => ({
            serviceId: serviceId,
            status: data.status,
            feedback: data.status === 'REJECTED' ? data.feedback?.trim() : '',
            resultDecisions: (data.resultDecisions || []).map(rd => ({
                taskId: rd.taskId,
                status: data.status,
                feedback: data.status === 'REJECTED' ? data.feedback?.trim() : ''
            }))
        }));

        try {
            await processAcceptance({ id: request.id, decisions: payload }).unwrap();
            toast.success('Xử lý kết quả nghiệm thu thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi xử lý');
        }
    };

    // Helper to get request status info
    const requestStatusInfo = useMemo(() => {
        if (!request?.status) return null;
        if (request.status === 'APPROVED') {
            return { label: 'Đã duyệt', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
        }
        if (request.status === 'REJECTED') {
            return { label: 'Từ chối', bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircle };
        }
        if (request.status === 'PROCESSED') {
            const hasRejected = request.services?.some(
                s => s.status === 'ACCEPTANCE_REJECTED' || s.results?.some(r => r.status === 'REJECTED')
            );
            if (hasRejected) {
                return { label: 'Từ chối nghiệm thu', bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircle };
            }
            return { label: 'Đã nghiệm thu', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
        }
        return { label: 'Chờ duyệt', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
    }, [request?.status, request?.services]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-lg border border-gray-200 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl text-theme-900">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                            isReadOnly ? 'bg-slate-700' : 'bg-blue-600'
                        }`}>
                            <Eye className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-gray-900 uppercase">
                                    {isReadOnly ? 'Chi tiết nghiệm thu' : 'Phê duyệt nghiệm thu'}
                                </h3>
                                {requestStatusInfo && (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${requestStatusInfo.bg}`}>
                                        <requestStatusInfo.icon className="w-3 h-3" />
                                        {requestStatusInfo.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 font-mono">{request.project?.name} - {request.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Read-only notice */}
                    {isReadOnly && (
                        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                            <span>Biên bản nghiệm thu này đã được xử lý ({requestStatusInfo?.label}). Dữ liệu đang được hiển thị ở chế độ xem lại.</span>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Người yêu cầu</p>
                            <p className="text-sm font-bold text-gray-900">{request.requester?.fullName || 'Team Lead'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ngày yêu cầu</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="col-span-2 text-theme-900">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ghi chú từ Team Lead</p>
                            <p className="text-sm text-gray-700 italic px-3 py-2 bg-white rounded-lg border border-gray-100">{request.note || 'Không có ghi chú'}</p>
                        </div>
                        {request.feedback && (
                            <div className="col-span-2">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Phản hồi từ người duyệt</p>
                                <p className="text-sm text-red-700 italic px-3 py-2 bg-red-50 rounded-lg border border-red-100">{request.feedback}</p>
                            </div>
                        )}
                    </div>

                    {/* Services List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <LayoutList className="w-4 h-4 text-blue-600" />
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Chi tiết từng hạng mục</h4>
                        </div>
                        <div className="space-y-4">
                            {request.services?.map((service) => {
                                const svcData = processedServicesData[service.id];
                                const isClosed = isReadOnly || svcData?.isServiceClosed;
                                const isRejected = service.status === 'ACCEPTANCE_REJECTED' || svcData?.rejectedCount > 0;
                                const isCompleted = service.status === 'COMPLETED' || (svcData?.allResults?.length > 0 && svcData?.approvedCount === svcData?.allResults?.length);

                                return (
                                    <div key={service.id} className="p-5 bg-white border border-gray-200 rounded-xl space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleService(service.id)}
                                                    className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"
                                                >
                                                    {expandedServices[service.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {service.service?.name || service.name}
                                                    </p>
                                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                                        {isClosed ? (
                                                            <p className={`text-[10px] font-mono font-medium ${isRejected ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                {isRejected 
                                                                    ? `Từ chối nghiệm thu (${svcData?.rejectedCount || 0} kết quả bị từ chối)`
                                                                    : `Đã hoàn thành (${svcData?.approvedCount || 0} kết quả đã duyệt)`
                                                                }
                                                            </p>
                                                        ) : (
                                                            <>
                                                                <p className="text-[10px] text-gray-500 font-mono">
                                                                    {svcData?.pending?.length || 0} kết quả cần duyệt
                                                                </p>
                                                                {svcData?.approvedCount > 0 && (
                                                                    <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-max border border-emerald-100">
                                                                        Đã có {svcData.approvedCount} kết quả được duyệt trước đó
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action or Status Badge for Service */}
                                            {isClosed ? (
                                                isRejected ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                                                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                                                        <span className="text-[10px] font-bold text-red-700">Từ chối nghiệm thu</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span className="text-[10px] font-bold text-emerald-700">Đã duyệt xong</span>
                                                    </div>
                                                )
                                            ) : (svcData?.pending?.length || 0) > 0 ? (
                                                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                                    <button
                                                        onClick={() => handleServiceDecision(service.id, 'APPROVED')}
                                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${decisions[service.id]?.status === 'APPROVED'
                                                            ? 'bg-emerald-600 text-white shadow-sm'
                                                            : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                                                            }`}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Đồng ý
                                                    </button>
                                                    <button
                                                        onClick={() => handleServiceDecision(service.id, 'REJECTED')}
                                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${decisions[service.id]?.status === 'REJECTED'
                                                            ? 'bg-red-600 text-white shadow-sm'
                                                            : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                                                            }`}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span className="text-[10px] font-bold text-emerald-700">Đã duyệt xong</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Service Rejection Feedback Input */}
                                        {!isClosed && (svcData?.pending?.length || 0) > 0 && decisions[service.id]?.status === 'REJECTED' && (
                                            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-1.5">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                                                    <MessageSquare className="w-3.5 h-3.5 text-red-500" />
                                                    Lý do từ chối hạng mục này <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none resize-none text-xs text-gray-800 placeholder-red-300 shadow-sm"
                                                    rows="2"
                                                    value={decisions[service.id]?.feedback || ''}
                                                    onChange={(e) => handleServiceFeedback(service.id, e.target.value)}
                                                    placeholder="Nhập lý do từ chối cho hạng mục này (bắt buộc để nhân sự thực hiện sửa lại)..."
                                                />
                                            </div>
                                        )}

                                        {/* Granular Results List */}
                                        <div className={`space-y-4 pl-8 border-l-2 border-gray-50 ${expandedServices[service.id] ? 'block' : 'hidden md:block'}`}>
                                            {(() => {
                                                const allResults = svcData?.allResults || [];

                                                if (allResults.length === 0) {
                                                    return (
                                                        <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                            <p className="text-xs text-gray-500">Chưa có kết quả nghiệm thu nào được gửi lên cho hạng mục này.</p>
                                                        </div>
                                                    );
                                                }

                                                return allResults.map((res, idx) => {
                                                    const isResApproved = res.status === 'APPROVED';
                                                    const isResRejected = res.status === 'REJECTED';

                                                    return (
                                                        <div key={res.taskId || idx} className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 space-y-3">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-5 h-5 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <p className="text-xs font-bold text-gray-700 truncate">
                                                                            {res.name || `Kết quả #${idx + 1}`}
                                                                        </p>
                                                                    </div>
                                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                        {res.url ? (
                                                                            <a
                                                                                href={getFilePreviewUrl(res.url, res.type)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center gap-2 px-2.5 py-1 bg-white text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold hover:bg-blue-50"
                                                                            >
                                                                                <FileText className="w-3 h-3" />
                                                                                Xem kết quả
                                                                                <ExternalLink className="w-3 h-3 opacity-40" />
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-[10px] text-gray-400 italic">Không có link đính kèm</span>
                                                                        )}
                                                                        {res.note && (
                                                                            <p className="text-[10px] text-gray-500 italic bg-white px-2 py-0.5 rounded border border-gray-100">
                                                                                {res.note}
                                                                            </p>
                                                                        )}
                                                                        {res.type === 'CHECKLIST' && res.checklist?.length > 0 && (
                                                                            <div className="w-full mt-1.5 space-y-1 bg-white p-2 rounded-lg border border-gray-100">
                                                                                {res.checklist.map((item, itemIdx) => (
                                                                                    <div key={item.criteriaId || itemIdx} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                                                                        <span>{item.label}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Actions or Status Badge for Result */}
                                                                {isReadOnly ? (
                                                                    isResApproved ? (
                                                                        <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                            <span className="text-[10px] font-bold text-emerald-700">Đã duyệt</span>
                                                                        </div>
                                                                    ) : isResRejected ? (
                                                                        <div className="flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                                                                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                                                                            <span className="text-[10px] font-bold text-red-700">Từ chối</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                                            <span className="text-[10px] font-bold text-amber-700">Chờ duyệt</span>
                                                                        </div>
                                                                    )
                                                                ) : isResApproved ? (
                                                                    <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                        <span className="text-[10px] font-bold text-emerald-700">Đã duyệt trước đó</span>
                                                                    </div>
                                                                ) : isClosed ? (
                                                                    <div className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                                                                        <span className="text-[10px] font-medium text-gray-500">Đã đóng</span>
                                                                    </div>
                                                                ) : decisions[service.id]?.status === 'REJECTED' ? (
                                                                    <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200">
                                                                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                                                                        <span className="text-[10px] font-bold">Từ chối nghiệm thu</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                        <span className="text-[10px] font-bold">Đồng ý nghiệm thu</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Rejection Feedback display callout if rejected in the past */}
                                                            {res.feedback && (
                                                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-1">
                                                                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                                                    <span className="text-[11px] text-red-800 font-medium">
                                                                        <span className="font-bold">Lý do từ chối:</span> {res.feedback}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                {isReadOnly ? (
                    <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-xl">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                            <span>Biên bản đã được xử lý xong</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                ) : (
                    <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50/30 rounded-b-xl">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white text-gray-600 font-bold rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || totalPendingResults === 0}
                            className={`flex-[2] px-4 py-2.5 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                                isAllRejected
                                    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
                            }`}
                            title={totalPendingResults === 0 ? 'Tất cả kết quả đã được xử lý' : ''}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : isAllRejected ? (
                                <XCircle className="w-4 h-4" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {isSubmitting
                                ? 'Đang lưu...'
                                : totalPendingResults === 0
                                    ? 'Không còn kết quả cần duyệt'
                                    : isAllRejected
                                        ? 'Xác nhận từ chối nghiệm thu'
                                        : 'Xác nhận kết quả nghiệm thu'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
