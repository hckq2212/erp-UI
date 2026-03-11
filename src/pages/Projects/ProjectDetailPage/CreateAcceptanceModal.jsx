import { useState } from 'react';
import { X, CheckCircle2, AlertCircle, FileText, Send } from 'lucide-react';
import { useCreateAcceptanceRequestMutation } from '../../../api/acceptances';
import { toast } from 'react-toastify';
import { getFilePreviewUrl } from '../../../utils/cloudinary';

export const CreateAcceptanceModal = ({ isOpen, onClose, contract, projectId }) => {
    const [createAcceptance, { isLoading }] = useCreateAcceptanceRequestMutation();
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [formData, setFormData] = useState({
        name: `NT-${contract.contractCode}-${new Date().toLocaleDateString('vi-VN')}`,
        note: '',
    });

    if (!isOpen) return null;

    // Also exclude services already pending or completed (though status check might cover this)
    const availableServices = contract.services?.filter(
        (s) => s.status === 'AWAITING_ACCEPTANCE' && s.result !== null
    ) || [];

    const toggleService = (id) => {
        setSelectedServiceIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedServiceIds.length === 0) {
            toast.error('Vui lòng chọn ít nhất một dịch vụ để nghiệm thu');
            return;
        }

        try {
            await createAcceptance({
                projectId,
                note: formData.note,
                serviceIds: selectedServiceIds,
            }).unwrap();
            toast.success('Gửi yêu cầu nghiệm thu thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 uppercase">Gửi nghiệm thu dịch vụ</h3>
                            <p className="text-sm text-gray-500 font-mono">{contract.contractCode}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-3 ml-1">Chọn dịch vụ nghiệm thu</label>
                        {availableServices.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {availableServices.map((service) => (
                                    <label
                                        key={service.id}
                                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${selectedServiceIds.includes(service.id)
                                            ? 'bg-emerald-50 border-emerald-200'
                                            : 'bg-gray-50 border-gray-100 hover:border-emerald-100'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            checked={selectedServiceIds.includes(service.id)}
                                            onChange={() => toggleService(service.id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-700 truncate">
                                                {service.service?.name || service.name}
                                            </p>
                                        </div>
                                        {service.result && (
                                            <a href={getFilePreviewUrl(service.result.url, service.result.type)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[10px] bg-white px-2 py-0.5 rounded-lg border border-gray-100 text-gray-500">
                                                <FileText className="w-3 h-3" />
                                                {service.result.name}
                                            </a>
                                        )}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-amber-50 rounded-3xl border border-amber-100">
                                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-sm text-amber-700 font-medium">Không có dịch vụ nào đủ điều kiện nghiệm thu.</p>
                                <p className="text-xs text-amber-600 mt-1">(Dịch vụ phải ở trạng thái ACTIVE và đã có file kết quả)</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Tên đợt nghiệm thu</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-200 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ví dụ: Nghiệm thu đợt 1"
                                disabled
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Ghi chú</label>
                            <textarea
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                                rows="3"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                placeholder="Nhập ghi chú (không bắt buộc)..."
                            />
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isLoading || availableServices.length === 0}
                        className="flex-[2] px-4 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:bg-emerald-300 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Đang gửi...' : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Gửi yêu cầu nghiệm thu</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
