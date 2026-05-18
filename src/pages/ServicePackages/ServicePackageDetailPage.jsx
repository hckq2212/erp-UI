import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useGetServicePackageQuery,
    useUpdateServicePackageMutation,
    useDeleteServicePackageMutation
} from '../../api/servicePackages';
import { useGetServicesQuery } from '../../api/services';
import {
    ArrowLeft, Package, Trash2, Plus, Save,
    Info, List, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/format';

export const ServicePackageDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: packageData, isLoading: isLoadingPkg, error } = useGetServicePackageQuery(id);
    const { data: servicesData = [] } = useGetServicesQuery();
    const services = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);

    const [updatePackage, { isLoading: isUpdating }] = useUpdateServicePackageMutation();
    const [deletePackage, { isLoading: isDeleting }] = useDeleteServicePackageMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        items: []
    });

    const calculatedTotalPrice = useMemo(() => {
        const itemsToUse = isEditing ? formData.items : packageData?.items || [];
        return itemsToUse.reduce((acc, item) => {
            const s = services.find(s => String(s.id) === String(item.serviceId));
            return acc + (s?.costPrice || 0) * (item.defaultQuantity || 0);
        }, 0);
    }, [isEditing, formData.items, packageData?.items, services]);

    // Sync formData when packageData is fetched
    useMemo(() => {
        if (packageData) {
            setFormData({
                name: packageData.name || '',
                description: packageData.description || '',
                items: (packageData.items || []).map(item => ({
                    id: item.id,
                    serviceId: item.serviceId,
                    defaultQuantity: item.defaultQuantity || 1
                }))
            });
        }
    }, [packageData]);

    if (isLoadingPkg) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium animate-pulse uppercase tracking-widest text-xs">Đang tải thông tin gói dịch vụ...</p>
            </div>
        );
    }

    if (error || !packageData) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto mt-10 p-10">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase">Lỗi hệ thống</h3>
                <p className="text-red-500 font-medium mb-6">Không tìm thấy thông tin gói dịch vụ hoặc có lỗi xảy ra.</p>
                <Button onClick={() => navigate('/service-packages')} className="bg-gray-900">
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { serviceId: '', defaultQuantity: 1 }]
        });
    };

    const handleRemoveItem = (index) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setFormData({ ...formData, items: updatedItems });
    };

    const handleSave = async () => {
        const validItems = formData.items.filter(item => item.serviceId);
        if (validItems.length === 0) {
            toast.error('Gói dịch vụ phải có ít nhất một hạng mục');
            return;
        }

        try {
            await updatePackage({
                id,
                name: formData.name,
                description: formData.description,
                items: validItems.map(item => ({
                    serviceId: item.serviceId,
                    defaultQuantity: Number(item.defaultQuantity)
                }))
            }).unwrap();

            toast.success('Cập nhật gói dịch vụ thành công');
            setIsEditing(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi cập nhật');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Bạn có chắc muốn xóa gói dịch vụ này? Hành động này không thể hoàn tác.')) {
            try {
                await deletePackage(id).unwrap();
                toast.success('Xóa gói dịch vụ thành công');
                navigate('/service-packages');
            } catch (err) {
                toast.error(err?.data?.message || 'Có lỗi xảy ra khi xóa');
            }
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20 max-w-5xl mx-auto">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/service-packages')}
                    className="flex items-center gap-2 group text-gray-400 hover:text-gray-900 transition-colors font-bold uppercase text-[10px] tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Quay lại danh sách
                </button>
                <div className="flex items-center gap-3">
                    {!isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                color="red"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="border-red-100 text-red-500 hover:bg-red-50 px-6 rounded-2xl"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa gói
                            </Button>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-600 text-white px-6 rounded-2xl shadow-lg shadow-gray-200"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Chỉnh sửa gói
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    // Reset form data to original
                                    setFormData({
                                        name: packageData.name || '',
                                        description: packageData.description || '',
                                        items: (packageData.items || []).map(item => ({
                                            serviceId: item.serviceId,
                                            defaultQuantity: item.defaultQuantity || 1
                                        }))
                                    });
                                }}
                                className="rounded-2xl"
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                onClick={handleSave}
                                isLoading={isUpdating}
                                className="bg-blue-600 shadow-lg shadow-blue-100 rounded-2xl"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Lưu thay đổi
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Package Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-200">
                                <Package className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                    {packageData.name}
                                </h1>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <Input
                                        label="Tên gói dịch vụ"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Nhập tên gói..."
                                    />
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Mô tả</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm min-h-[120px]"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Nhập mô tả..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                                            <Info className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Mô tả gói</span>
                                        </div>
                                        <p className="text-gray-700 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                            {packageData.description || 'Không có mô tả cho gói dịch vụ này.'}
                                        </p>
                                    </div>

                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items List Card */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                    <List className="h-5 w-5" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 uppercase">Danh sách Hạng mục công việc</h2>
                            </div>
                            {isEditing && (
                                <button
                                    onClick={handleAddItem}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    <Plus className="h-4 w-4" />
                                    Thêm dịch vụ
                                </button>
                            )}
                        </div>

                        <div className="flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/30 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dịch vụ</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Đơn giá</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Số lượng</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Thành tiền</th>
                                        {isEditing && <th className="px-8 py-4"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(isEditing ? formData.items : packageData.items || []).map((item, index) => {
                                        const serviceInfo = services.find(s => String(s.id) === String(item.serviceId));

                                        return (
                                            <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <select
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-gray-700"
                                                            value={item.serviceId}
                                                            onChange={(e) => handleItemChange(index, 'serviceId', e.target.value)}
                                                        >
                                                            <option value="">-- Chọn dịch vụ --</option>
                                                            {services.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                            <p className="font-bold text-gray-700 uppercase text-xs tracking-tight">
                                                                {item.service?.name || serviceInfo?.name || 'Dịch vụ không xác định'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="text-center font-medium text-gray-600 text-sm">
                                                        {formatCurrency(serviceInfo?.costPrice || 0)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex justify-center">
                                                        {isEditing ? (
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="w-24 px-4 py-3 pr-10 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-center"
                                                                    value={item.defaultQuantity}
                                                                    onChange={(e) => handleItemChange(index, 'defaultQuantity', e.target.value)}
                                                                />
                                                                {serviceInfo?.unit && (
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none uppercase">
                                                                        {serviceInfo.unit}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-xl font-black text-sm">
                                                                {item.defaultQuantity} {item.service?.unit || serviceInfo?.unit}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right font-bold text-blue-600 text-sm">
                                                    {formatCurrency((serviceInfo?.costPrice || 0) * item.defaultQuantity)}
                                                </td>
                                                {isEditing && (
                                                    <td className="px-8 py-5 text-right">
                                                        <button
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}

                                    {(isEditing ? formData.items : packageData.items || []).length === 0 ? (
                                        <tr>
                                            <td colSpan={isEditing ? 5 : 4} className="px-8 py-12 text-center text-gray-400 italic font-medium">
                                                Chưa có hạng mục nào cho gói này.
                                                {isEditing && ' Hãy bấm "Thêm dịch vụ" ở trên.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr className="bg-gray-50/50 border-t border-gray-100 font-bold">
                                            <td colSpan={isEditing ? 3 : 3} className="px-8 py-4 text-gray-900 text-left uppercase tracking-widest text-md">
                                                Tổng cộng
                                            </td>
                                            <td className=" pr-7 py-2 text-right text-md font-black text-blue-700">
                                                {formatCurrency(calculatedTotalPrice)}
                                            </td>
                                            {isEditing && <td></td>}
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
