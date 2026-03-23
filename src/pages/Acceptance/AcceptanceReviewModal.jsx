import { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, XCircle, FileText, ExternalLink, MessageSquare, AlertCircle, Eye, LayoutList, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useProcessAcceptanceRequestMutation } from '../../api/acceptances';
import { toast } from 'react-toastify';
import { getFilePreviewUrl } from '../../utils/cloudinary';

export const AcceptanceReviewModal = ({ isOpen, onClose, request }) => {
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
                
                const uniqueResults = Array.from(uniqueResultsMap.values());
                const pending = uniqueResults.filter(res => res.status !== 'APPROVED').reverse();
                
                data[service.id] = { 
                    pending, 
                    approvedCount: uniqueResults.length - pending.length 
                };
            });
        }
        return data;
    }, [request?.services]);

    // Initialize decisions when request changes
    useEffect(() => {
        if (request?.services) {
            const initialDecisions = {};
            request.services.forEach(s => {
                initialDecisions[s.id] = {
                    status: 'APPROVED',
                    feedback: '',
                    resultDecisions: (s.results || [])
                        .filter(r => r.status !== 'APPROVED')
                        .map(r => ({
                            taskId: r.taskId,
                            status: 'APPROVED', // Default to approved for pending
                            feedback: ''
                        }))
                };
            });
            setDecisions(initialDecisions);
        }
    }, [request]);

    if (!isOpen) return null;

    const toggleService = (serviceId) => {
        setExpandedServices(prev => ({ ...prev, [serviceId]: !prev[serviceId] }));
    };

    const handleServiceDecision = (serviceId, status) => {
        setDecisions(prev => {
            const current = prev[serviceId];
            return {
                ...prev,
                [serviceId]: {
                    ...current,
                    status,
                    // If approving/rejecting whole service, auto-set all results
                    resultDecisions: current.resultDecisions.map(rd => ({
                        ...rd,
                        status: status
                    }))
                }
            };
        });
    };

    const handleResultDecision = (serviceId, taskId, status) => {
        setDecisions(prev => {
            const current = prev[serviceId];
            const updatedResultDecisions = current.resultDecisions.map(rd =>
                rd.taskId === taskId ? { ...rd, status } : rd
            );

            // If all results are approved, service is approved. If any rejected, service is technically rejected in terms of overall status
            const anyRejected = updatedResultDecisions.some(rd => rd.status === 'REJECTED');

            return {
                ...prev,
                [serviceId]: {
                    ...current,
                    status: anyRejected ? 'REJECTED' : 'APPROVED',
                    resultDecisions: updatedResultDecisions
                }
            };
        });
    };

    const handleResultFeedback = (serviceId, taskId, feedback) => {
        setDecisions(prev => {
            const current = prev[serviceId];
            return {
                ...prev,
                [serviceId]: {
                    ...current,
                    resultDecisions: current.resultDecisions.map(rd =>
                        rd.taskId === taskId ? { ...rd, feedback } : rd
                    )
                }
            };
        });
    };

    const handleSubmit = async () => {
        const payload = Object.entries(decisions).map(([serviceId, data]) => ({
            serviceId: serviceId,
            status: data.status,
            feedback: data.feedback,
            resultDecisions: data.resultDecisions
        }));

        // Validation: Every rejected result must have feedback
        for (const serviceDecision of payload) {
            for (const rd of serviceDecision.resultDecisions) {
                if (rd.status === 'REJECTED' && !rd.feedback?.trim()) {
                    toast.error('Vui lòng nhập lý do từ chối cho các kết quả bị loại');
                    return;
                }
            }
        }

        try {
            await processAcceptance({ id: request.id, decisions: payload }).unwrap();
            toast.success('Xử lý kết quả nghiệm thu thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi xử lý');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-lg border border-gray-200 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl text-theme-900	">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <Eye className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 uppercase">Phê duyệt nghiệm thu</h3>
                            <p className="text-sm text-gray-500 font-mono">{request.project?.name} - {request.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
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
                        <div className="col-span-2 text-theme-900	">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ghi chú từ Team Lead</p>
                            <p className="text-sm text-gray-700 italic px-3 py-2 bg-white rounded-lg border border-gray-100">{request.note || 'Không có ghi chú'}</p>
                        </div>
                    </div>

                    {/* Services List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <LayoutList className="w-4 h-4 text-blue-600" />
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Chi tiết từng hạng mục</h4>
                        </div>
                        <div className="space-y-4">
                            {request.services?.map((service) => (
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
                                                    <p className="text-[10px] text-gray-500 font-mono">
                                                        {processedServicesData[service.id]?.pending?.length || 0} kết quả cần duyệt
                                                    </p>
                                                    {(() => {
                                                        const approvedCount = processedServicesData[service.id]?.approvedCount || 0;
                                                        if (approvedCount > 0) {
                                                            return (
                                                                <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-max border border-emerald-100">
                                                                    Đã có {approvedCount} kết quả được duyệt trước đó
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                            <button
                                                onClick={() => handleServiceDecision(service.id, 'APPROVED')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold ${decisions[service.id]?.status === 'APPROVED'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                                                    }`}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Duyệt tất cả
                                            </button>
                                            <button
                                                onClick={() => handleServiceDecision(service.id, 'REJECTED')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold ${decisions[service.id]?.status === 'REJECTED'
                                                    ? 'bg-red-600 text-white'
                                                    : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                                                    }`}
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Từ chối tất cả
                                            </button>
                                        </div>
                                    </div>

                                    {/* Granular Results List */}
                                    <div className={`space-y-4 pl-8 border-l-2 border-gray-50 ${expandedServices[service.id] ? 'block' : 'hidden md:block'}`}>
                                            {(() => {
                                                const pendingResults = processedServicesData[service.id]?.pending || [];

                                                if (pendingResults.length === 0) {
                                                    return (
                                                        <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                            <p className="text-xs text-gray-500">Tất cả kết quả của hạng mục này đã được duyệt.</p>
                                                        </div>
                                                    );
                                                }

                                                return pendingResults.map((res, idx) => {
                                                const decision = decisions[service.id]?.resultDecisions?.find(rd => rd.taskId === res.taskId);
                                                return (
                                                <div key={res.taskId} className="bg-gray-50/50 p-4 rounded-lg border border-gray-50 space-y-3">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-5 h-5 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400">{idx + 1}</span>
                                                                <p className="text-xs font-bold text-gray-700 truncate">{res.name}</p>
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2">
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
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-100">
                                                            <button
                                                                onClick={() => handleResultDecision(service.id, res.taskId, 'APPROVED')}
                                                                className={`p-1.5 rounded-lg ${decision?.status === 'APPROVED'
                                                                    ? 'bg-emerald-50 text-emerald-600'
                                                                    : 'text-gray-300 hover:text-emerald-400'
                                                                    }`}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleResultDecision(service.id, res.taskId, 'REJECTED')}
                                                                className={`p-1.5 rounded-lg ${decision?.status === 'REJECTED'
                                                                    ? 'bg-red-50 text-red-600'
                                                                    : 'text-gray-300 hover:text-red-400'
                                                                    }`}
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {decision?.status === 'REJECTED' && (
                                                        <div className="mt-2">
                                                            <div className="flex gap-2">
                                                                <MessageSquare className="w-3.5 h-3.5 text-red-400 mt-1 flex-shrink-0" />
                                                                <textarea
                                                                    className="w-full px-3 py-1.5 bg-white border border-red-100 rounded-lg focus:ring-1 focus:ring-red-500 outline-none resize-none text-[10px] text-red-900 placeholder-red-300"
                                                                    rows="1"
                                                                    value={decision.feedback}
                                                                    onChange={(e) => handleResultFeedback(service.id, res.taskId, e.target.value)}
                                                                    placeholder="Lý do từ chối kết quả này..."
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                            });
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50/30 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white text-gray-600 font-bold rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || request.status !== 'PENDING'}
                        className="flex-[2] px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {isSubmitting ? 'Đang lưu...' : 'Xác nhận kết quả nghiệm thu'}
                    </button>
                </div>
            </div>
        </div>
    );
};
