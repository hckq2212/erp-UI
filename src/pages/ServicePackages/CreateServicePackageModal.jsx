import { useState } from 'react';
import { X, Plus, Trash2, Package, LayoutList, CheckCircle2 } from 'lucide-react';
import { useCreateServicePackageMutation } from '../../api/servicePackages';
import { useGetServicesQuery } from '../../api/services';
import { toast } from 'react-toastify';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const CreateServicePackageModal = ({ isOpen, onClose }) => {
    const [createPackage, { isLoading }] = useCreateServicePackageMutation();
    const { data: servicesData = [] } = useGetServicesQuery();
    const services = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    const [selectedItems, setSelectedItems] = useState([
        { serviceId: '', defaultQuantity: 1 }
    ]);

    if (!isOpen) return null;

    const addItem = () => {
        setSelectedItems([...selectedItems, { serviceId: '', defaultQuantity: 1 }]);
    };

    const removeItem = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...selectedItems];
        updated[index] = { ...updated[index], [field]: value };
        setSelectedItems(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validItems = selectedItems.filter(item => item.serviceId);
        if (validItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất một dịch vụ cho gói');
            return;
        }

        try {
            await createPackage({
                ...formData,
                items: validItems.map(item => ({
                    serviceId: item.serviceId,
                    defaultQuantity: Number(item.defaultQuantity)
                }))
            }).unwrap();

            toast.success('Tạo gói dịch vụ thành công');
            onClose();
            setFormData({ name: '', description: '' });
            setSelectedItems([{ serviceId: '', defaultQuantity: 1 }]);
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo gói dịch vụ');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 uppercase">Thêm Gói dịch vụ mới</h3>
                            <p className="text-sm text-gray-500 font-medium">Định nghĩa tập hợp các dịch vụ mẫu</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label="Tên gói dịch vụ *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ví dụ: Gói Video Marketing Basic"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Mô tả</label>
                            <textarea
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm min-h-[80px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả ngắn gọn về gói dịch vụ này..."
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <LayoutList className="w-4 h-4 text-blue-600" />
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Chi tiết dịch vụ trong gói</h4>
                            </div>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                THÊM DỊCH VỤ
                            </button>
                        </div>

                        <div className="space-y-3">
                            {selectedItems.map((item, index) => (
                                <div key={index} className="flex gap-3 items-end group animate-in slide-in-from-left-2 duration-200">
                                    <div className="flex-1">
                                        {index === 0 && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Dịch vụ</label>}
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                            value={item.serviceId}
                                            onChange={(e) => handleItemChange(index, 'serviceId', e.target.value)}
                                            required={index === 0}
                                        >
                                            <option value="">-- Chọn dịch vụ --</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        {index === 0 && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Số lượng</label>}
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-center"
                                            value={item.defaultQuantity}
                                            onChange={(e) => handleItemChange(index, 'defaultQuantity', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className={`p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all ${selectedItems.length === 1 ? 'invisible' : ''}`}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50 rounded-b-3xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white text-gray-600 font-bold rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all active:scale-95"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:bg-blue-300 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Tạo Gói dịch vụ</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
