import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, FileText, ExternalLink, MessageSquare, AlertCircle, Eye, LayoutList, Send } from 'lucide-react';
import { useProcessAcceptanceRequestMutation } from '../../api/acceptances';
import { toast } from 'react-toastify';
import { getFilePreviewUrl } from '../../utils/cloudinary';

export const AcceptanceReviewModal = ({ isOpen, onClose, request }) => {
    const [processAcceptance, { isLoading: isSubmitting }] = useProcessAcceptanceRequestMutation();
    const [decisions, setDecisions] = useState({});

    // Initialize decisions when request changes
    useEffect(() => {
        if (request?.services) {
            const initialDecisions = {};
            request.services.forEach(s => {
                initialDecisions[s.id] = { status: 'APPROVED', feedback: '' };
            });
            setDecisions(initialDecisions);
        }
    }, [request]);

    if (!isOpen) return null;

    const handleDecisionChange = (serviceId, status) => {
        setDecisions(prev => ({
            ...prev,
            [serviceId]: { ...prev[serviceId], status }
        }));
    };

    const handleFeedbackChange = (serviceId, feedback) => {
        setDecisions(prev => ({
            ...prev,
            [serviceId]: { ...prev[serviceId], feedback }
        }));
    };

    const handleSubmit = async () => {
        const payload = Object.entries(decisions).map(([serviceId, data]) => ({
            serviceId: Number(serviceId),
            status: data.status,
            feedback: data.status === 'REJECTED' ? data.feedback : undefined
        }));

        if (payload.some(d => d.status === 'REJECTED' && !d.feedback?.trim())) {
            toast.error('Vui lòng nhập lý do từ chối cho các hạng mục bị loại');
            return;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                            <Eye className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 uppercase">Phê duyệt nghiệm thu</h3>
                            <p className="text-sm text-gray-500 font-mono">{request.project?.name} - {request.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Người yêu cầu</p>
                            <p className="text-sm font-bold text-gray-900">{request.requester?.fullName || 'Team Lead'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ngày yêu cầu</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ghi chú từ Team Lead</p>
                            <p className="text-sm text-gray-700 italic px-3 py-2 bg-white rounded-xl border border-gray-100">{request.note || 'Không có ghi chú'}</p>
                        </div>
                    </div>

                    {/* Services List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <LayoutList className="w-4 h-4 text-blue-600" />
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Quyết định từng hạng mục</h4>
                        </div>
                        <div className="space-y-4">
                            {request.services?.map((service) => (
                                <div key={service.id} className="p-4 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4 transition-all hover:border-blue-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900">
                                                {service.service?.name || service.name}
                                            </p>
                                            {service.result && (
                                                <a
                                                    href={getFilePreviewUrl(service.result.url, service.result.type)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-bold hover:bg-amber-100 transition-all"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    {service.result.name}
                                                    <ExternalLink className="w-3 h-3 opacity-40 ml-1" />
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
                                            <button
                                                onClick={() => handleDecisionChange(service.id, 'APPROVED')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${decisions[service.id]?.status === 'APPROVED'
                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                                                    : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                                                    }`}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Đồng ý
                                            </button>
                                            <button
                                                onClick={() => handleDecisionChange(service.id, 'REJECTED')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${decisions[service.id]?.status === 'REJECTED'
                                                    ? 'bg-red-600 text-white shadow-md shadow-red-100'
                                                    : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                                                    }`}
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Từ chối
                                            </button>
                                        </div>
                                    </div>

                                    {decisions[service.id]?.status === 'REJECTED' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <textarea
                                                className="w-full px-4 py-2 bg-red-50 border border-red-100 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none text-xs text-red-900 placeholder-red-300"
                                                rows="2"
                                                value={decisions[service.id]?.feedback}
                                                onChange={(e) => handleFeedbackChange(service.id, e.target.value)}
                                                placeholder="Lý do từ chối hạng mục này..."
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || request.status !== 'PENDING'}
                        className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:bg-blue-300 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Đang lưu...' : 'Lưu kết quả nghiệm thu'}
                    </button>
                </div>
            </div>
        </div>
    );
};
