import { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Package, LayoutList, CheckCircle2 } from 'lucide-react';
import Select from 'react-select';
import { useCreateServicePackageMutation } from '../../api/servicePackages';
import { useGetServicesQuery } from '../../api/services';
import { toast } from 'react-toastify';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/format';

export const CreateServicePackageModal = ({ isOpen, onClose }) => {
    const [createPackage, { isLoading }] = useCreateServicePackageMutation();

    // Lazy fetching state
    const [page, setPage] = useState(1);
    const [allServices, setAllServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: servicesResponse, isFetching } = useGetServicesQuery({
        page,
        limit: 20,
        name: searchTerm || undefined
    }, { skip: !isOpen });

    useEffect(() => {
        if (servicesResponse?.data) {
            if (page === 1) {
                setAllServices(servicesResponse.data);
            } else {
                setAllServices(prev => {
                    const existingIds = new Set(prev.map(s => s.id));
                    const newItems = servicesResponse.data.filter(s => !existingIds.has(s.id));
                    return [...prev, ...newItems];
                });
            }
        }
    }, [servicesResponse, page]);

    const hasMore = servicesResponse?.meta ? page < servicesResponse.meta.totalPages : false;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    const [selectedItems, setSelectedItems] = useState([
        { serviceId: '', defaultQuantity: 1 }
    ]);

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

    const handleMenuScrollToBottom = () => {
        if (hasMore && !isFetching) {
            setPage(prev => prev + 1);
        }
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(1);
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

    // Filtered options for each row
    const selectedIds = useMemo(() =>
        selectedItems.map(item => item.serviceId).filter(Boolean),
        [selectedItems]);

    const getOptions = (currentIndex) => {
        const currentId = selectedItems[currentIndex].serviceId;
        const otherSelectedIds = selectedIds.filter(id => id !== currentId);

        return allServices
            .filter(s => !otherSelectedIds.includes(s.id))
            .map(s => ({
                value: s.id,
                label: s.name,
                price: s.costPrice,
                service: s
            }));
    };

    const selectStyles = {
        control: (base) => ({
            ...base,
            borderRadius: '1rem',
            padding: '2px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            boxShadow: 'none',
            '&:hover': {
                border: '1px solid #F38820'
            }
        }),
        option: (base, state) => ({
            ...base,
            fontSize: '0.875rem',
            backgroundColor: state.isSelected ? '#F38820' : state.isFocused ? '#fff7ed' : 'white',
            color: state.isSelected ? 'white' : '#374151',
        })
    };

    const totalPackagePrice = useMemo(() => {
        return selectedItems.reduce((acc, item) => {
            const service = allServices.find(s => s.id === item.serviceId);
            return acc + (service?.costPrice || 0) * (item.defaultQuantity || 0);
        }, 0);
    }, [selectedItems, allServices]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
                    <div className="flex items-center gap-3">

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
                            {selectedItems.map((item, index) => {
                                const options = getOptions(index);
                                const selectedOption = options.find(opt => opt.value === item.serviceId);

                                return (
                                    <div key={index} className="flex gap-3 items-end group">
                                        <div className="flex-1">
                                            {index === 0 && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Dịch vụ</label>}
                                            <Select
                                                options={options}
                                                value={selectedOption || null}
                                                onChange={(val) => handleItemChange(index, 'serviceId', val ? val.value : '')}
                                                onMenuScrollToBottom={handleMenuScrollToBottom}
                                                onInputChange={handleSearchChange}
                                                placeholder="-- Tìm dịch vụ --"
                                                isClearable
                                                styles={selectStyles}
                                                isLoading={isFetching && page === 1}
                                                noOptionsMessage={() => isFetching ? "Đang tải..." : "Không tìm thấy dịch vụ"}
                                            />
                                        </div>
                                        <div className="w-40">
                                            {index === 0 && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1 text-right">Giá tiền</label>}
                                            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-blue-600 text-right h-[46px] flex items-center justify-end">
                                                {selectedOption ? formatCurrency(selectedOption.price) : '-'}
                                            </div>
                                        </div>
                                        <div className="w-24 relative">
                                            {index === 0 && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1 text-center">Số lượng</label>}
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full pl-3 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-center h-[46px]"
                                                    value={item.defaultQuantity}
                                                    onChange={(e) => handleItemChange(index, 'defaultQuantity', e.target.value)}
                                                    required
                                                />
                                                {selectedOption?.service?.unit && (
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none uppercase">
                                                        {selectedOption.service.unit}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-40">
                                            {index === 0 && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1 text-right">Thành tiền</label>}
                                            <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-black text-blue-700 text-right h-[46px] flex items-center justify-end shadow-sm">
                                                {selectedOption ? formatCurrency(selectedOption.price * item.defaultQuantity) : '-'}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className={`p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all ${selectedItems.length === 1 ? 'invisible' : ''} mb-0.5`}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {selectedItems.length > 0 && (
                            <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end">
                                <div className="bg-blue-600 px-6 py-4 rounded-3xl shadow-xl shadow-blue-200 flex items-center gap-6 text-white">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Tổng giá trị gói</span>
                                        <span className="text-2xl font-black">{formatCurrency(totalPackagePrice)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50 rounded-b-3xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white text-gray-600 font-bold rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:bg-blue-300 disabled:shadow-none flex items-center justify-center gap-2"
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
