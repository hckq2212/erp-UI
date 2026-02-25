import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGetCustomerQuery, useUpdateCustomerMutation } from '../../api/customers';
import { useGetOpportunitiesQuery } from '../../api/opportunities';
import { useGetContractsQuery } from '../../api/contracts';
import {
    User,
    Phone,
    Mail,
    MapPin,
    Hash,
    Link as LinkIcon,
    ArrowLeft,
    Pencil,
    LayoutDashboard,
    FileText,
    ExternalLink,
    Building2,
    Calendar,
    Briefcase,
    FileSignature
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CustomerModal } from './CustomerModal';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';
import { OPPORTUNITY_STATUS_LABELS, OPPORTUNITY_STATUS_COLORS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '../../utils/enums';

export const CustomerDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: customer, isLoading, error } = useGetCustomerQuery(id);
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

    // Fetch associated data
    const { data: opportunitiesResult } = useGetOpportunitiesQuery({ customerId: id });
    const { data: contractsResult } = useGetContractsQuery({ customerId: id });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const opportunities = opportunitiesResult?.data || [];
    const contracts = contractsResult?.data || [];

    const handleEditSubmit = async (data) => {
        try {
            await updateCustomer({ id, ...data }).unwrap();
            toast.success('Cập nhật thông tin khách hàng thành công');
            setIsEditModalOpen(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi cập nhật');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 font-medium">Không tìm thấy thông tin khách hàng</p>
                <Button onClick={() => navigate('/customers')} variant="ghost" className="mt-4">
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Navigation & Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => navigate('/customers')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-blue-600 transition-colors w-fit group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách
                </button>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-200">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{customer.name}</h1>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    customer.source === 'INTERNAL'
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-indigo-50 text-indigo-700 border-indigo-100"
                                )}>
                                    {customer.source === 'INTERNAL' ? 'Nội bộ' : 'Đối tác'}
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Chi tiết hồ sơ đối tác khách hàng
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setIsEditModalOpen(true)} className="shadow-lg shadow-blue-500/20">
                        <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa hồ sơ
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar: Information Card */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" /> Thông tin liên hệ
                            </h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Số điện thoại</p>
                                <p className="text-gray-900 font-bold hover:text-blue-600 transition-colors flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-blue-400" /> {customer.phone}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                                <p className="text-gray-900 font-bold hover:text-blue-600 transition-colors flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-indigo-400" /> {customer.email}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mã số thuế</p>
                                <p className="text-gray-900 font-bold flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-amber-400" /> {customer.taxId || '---'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Địa chỉ</p>
                                <p className="text-gray-700 font-medium flex items-start gap-2 leading-relaxed">
                                    <MapPin className="w-4 h-4 text-rose-400 mt-1 flex-shrink-0" /> {customer.address}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats or Highlights */}
                    <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                        <LayoutDashboard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-blue-100 font-bold uppercase tracking-widest text-[10px] mb-6">Tổng quan giao dịch</h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-tighter mb-1">Cơ hội</p>
                                <p className="text-2xl font-black">{opportunities.length}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-tighter mb-1">Hợp đồng</p>
                                <p className="text-2xl font-black">{contracts.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Opportunities and Contracts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Opportunities Section */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-amber-500" /> Cơ hội kinh doanh
                            </h2>
                            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {opportunities.length}
                            </span>
                        </div>
                        <div className="p-2">
                            {opportunities.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {opportunities.map((opp) => (
                                        <div key={opp.id} className="p-6 hover:bg-gray-50/80 transition-all group rounded-2xl">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">{opp.name}</h4>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                {opp.opportunityCode}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                <span>{new Date(opp.createdAt).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-3">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                                                        OPPORTUNITY_STATUS_COLORS[opp.status]
                                                    )}>
                                                        {OPPORTUNITY_STATUS_LABELS[opp.status] || opp.status}
                                                    </span>
                                                    <button
                                                        onClick={() => navigate(`/opportunities/${opp.id}`)}
                                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        Chi tiết <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                        <Briefcase className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-gray-400 italic text-sm">Chưa có cơ hội kinh doanh nào cho khách hàng này.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contracts Section */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <FileSignature className="w-5 h-5 text-indigo-500" /> Hợp đồng & Pháp lý
                            </h2>
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {contracts.length}
                            </span>
                        </div>
                        <div className="p-2">
                            {contracts.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {contracts.map((contract) => (
                                        <div key={contract.id} className="p-6 hover:bg-gray-50/80 transition-all group rounded-2xl">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                        <FileSignature className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{contract.name}</h4>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                                                {formatCurrency(contract.totalValue)}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                <span>{new Date(contract.createdAt).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-3">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                                                        CONTRACT_STATUS_COLORS[contract.status]
                                                    )}>
                                                        {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
                                                    </span>
                                                    <button
                                                        onClick={() => navigate(`/contracts/${contract.id}`)}
                                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        Chi tiết <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                        <FileSignature className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-gray-400 italic text-sm">Hiện chưa có hợp đồng nào được ký kết.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CustomerModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                customer={customer}
                onSubmit={handleEditSubmit}
                isSubmitting={isUpdating}
            />
        </div>
    );
};
