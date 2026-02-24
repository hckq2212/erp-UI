import { useState, useEffect } from 'react';
import { X, FileText, Check } from 'lucide-react';
import { formatNumber, parseNumber } from '../../../utils/format';
import { useCreateAddendumQuotationMutation } from '../../../api/quotations';
import { useAssessExtraTaskMutation } from '../../../api/tasks';
import { toast } from 'react-toastify';

export const AddendumQuotationModal = ({ isOpen, onClose, task, opportunityId, onSubmitted }) => {
    const [priceType, setPriceType] = useState('recommended'); // minimum, recommended, custom
    const [notes, setNotes] = useState('');
    const [sellingPrice, setSellingPrice] = useState(0);

    const [assessExtraTask] = useAssessExtraTaskMutation();
    const [createAddendumQuotation, { isLoading: isCreating }] = useCreateAddendumQuotationMutation();

    useEffect(() => {
        if (isOpen && task) {
            setNotes(`Báo giá phụ lục cho công việc: ${task.name}`);
            setSellingPrice(task.sellingPrice || 0);

            // If task already has a custom price or it's been set in the previous component, handle it
            // However, the costPrice should come from task.job.costPrice
            if (task.sellingPrice && task.sellingPrice > 0) {
                setPriceType('custom');
            }
        }
    }, [isOpen, task]);

    const costPrice = task.job?.costPrice ? parseFloat(task.job.costPrice) : 0;
    const minPrice = costPrice * 1.2;
    const recommendedPrice = costPrice * 1.4;

    const currentSellingPrice = priceType === 'minimum' ? minPrice
        : priceType === 'recommended' ? recommendedPrice
            : sellingPrice;

    const profitMargin = currentSellingPrice > 0
        ? ((currentSellingPrice - costPrice) / currentSellingPrice) * 100
        : 0;

    const handleSubmit = async () => {
        try {
            // 1. Update task pricing first (billable = true, no serviceId required anymore per user request)
            await assessExtraTask({
                id: task.id,
                isBillable: true,
                sellingPrice: Number(currentSellingPrice),
                isRejected: false
            }).unwrap();

            // 2. Submit the addendum quotation
            await createAddendumQuotation({
                opportunityId: opportunityId,
                taskIds: [task.id],
                note: notes
            }).unwrap();

            toast.success('Tạo báo giá phụ lục thành công');
            onSubmitted && onSubmitted();
            onClose();
            
            // Refresh page after successful submission
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo báo giá');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Báo giá công việc phát sinh
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Task Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Công việc</label>
                        <h4 className="text-lg font-bold text-gray-900">{task.name}</h4>
                        <p className="text-sm text-gray-500">Mã CV: {task.code} | Dự án: {task.project?.name}</p>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase">Hạng mục</p>
                            <p className="font-bold text-gray-900">{task.job?.name || task.name}</p>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {['minimum', 'recommended', 'custom'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPriceType(type)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${priceType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                                        }`}
                                >
                                    {type === 'minimum' ? 'Giá tối thiểu' : type === 'recommended' ? 'Giá đề xuất' : 'Tùy chỉnh'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Table */}
                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Hạng mục</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Giá vốn (Job)</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Giá tối thiểu (20%)</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Giá đề xuất (40%)</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600 bg-blue-50/50">Giá bán áp dụng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-4 py-4 font-medium text-gray-900">{task.name}</td>
                                    <td className="px-4 py-4 text-right">{formatNumber(costPrice)}</td>
                                    <td className="px-4 py-4 text-right">{formatNumber(minPrice)}</td>
                                    <td className="px-4 py-4 text-right">{formatNumber(recommendedPrice)}</td>
                                    <td className="px-4 py-4 text-right">
                                        {priceType === 'custom' ? (
                                            <input
                                                type="text"
                                                className="w-full max-w-[150px] px-2 py-1 text-right border border-blue-200 rounded outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                                                value={formatNumber(sellingPrice)}
                                                onChange={(e) => setSellingPrice(parseNumber(e.target.value))}
                                            />
                                        ) : (
                                            <span className="font-bold text-blue-600">{formatNumber(currentSellingPrice)}</span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Profit Margin Info */}
                    <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between transition-all">
                        <div>
                            <p className="text-sm text-blue-700 mb-1 font-bold">Tỉ suất lợi nhuận dự kiến:</p>
                            <div className="flex items-center gap-3">
                                <span className={`text-2xl font-black ${profitMargin >= 25 ? 'text-green-600' : profitMargin >= 15 ? 'text-blue-600' : 'text-amber-600'}`}>
                                    {profitMargin.toFixed(1)}%
                                </span>
                                <div className="h-2 w-32 bg-blue-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${profitMargin >= 28 ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min(profitMargin * 2, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-blue-700 mb-1 font-bold">Lợi nhuận gộp:</p>
                            <p className="text-xl font-black text-blue-900">
                                {formatNumber(currentSellingPrice - costPrice)} VNĐ
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Ghi chú báo giá</label>
                        <textarea
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Nhập ghi chú..."
                        />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all font-inter"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isCreating}
                            className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:bg-blue-300 flex items-center justify-center gap-2"
                        >
                            {isCreating ? 'Đang xử lý...' : (
                                <>
                                    <Check className="w-5 h-5" />
                                    <span>Xác nhận & Tạo báo giá</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
