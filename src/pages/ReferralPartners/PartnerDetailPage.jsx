import { useParams, useNavigate } from 'react-router-dom';
import {
    Users,
    Mail,
    Phone,
    MapPin,
    TrendingUp,
    Building2,
    Calendar,
    FileText,
    DollarSign,
    ChevronLeft,
    Briefcase,
    Target,
    Clock,
    Wallet,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Search,
    Edit2,
    Save,
    RotateCcw,
    Info
} from 'lucide-react';

import {
    useGetReferralPartnerQuery,
    useGetReferralPartnerStatisticsQuery,
    useUpdateReferralPartnerMutation
} from '../../api/referralPartners';
import { formatCurrency, formatDate } from '../../utils/format';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import { cn } from '../../utils/cn';
import { PARTNER_TYPE_LABELS } from '../../utils/enums';
import { Input } from '../../components/ui/Input';
import { toast } from 'react-toastify';
import { AdditionalInfo } from '../../components/shared/AdditionalInfo';


export const PartnerDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('opportunities');

    const { data: partner, isLoading: isPartnerLoading } = useGetReferralPartnerQuery(id);
    const { data: stats, isLoading: isStatsLoading } = useGetReferralPartnerStatisticsQuery(id);
    const [updatePartner, { isLoading: isUpdating }] = useUpdateReferralPartnerMutation();
    const currentUser = useSelector(selectCurrentUser);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'BOD';

    useEffect(() => {
        if (partner) {
            setFormData({
                name: partner.name || '',
                email: partner.email || '',
                phone: partner.phone || '',
                address: partner.address || '',
                taxId: partner.taxId || '',
                type: partner.type || 'BUSINESS',
            });
        }
    }, [partner]);

    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: partner.name || '',
            email: partner.email || '',
            phone: partner.phone || '',
            address: partner.address || '',
            taxId: partner.taxId || '',
            type: partner.type || 'BUSINESS',
        });
    };

    const handleSave = async () => {
        try {
            await updatePartner({ id, ...formData }).unwrap();
            toast.success('Cập nhật thông tin đối tác thành công');
            setIsEditing(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi cập nhật');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (isPartnerLoading || isStatsLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-gray-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Đang tải dữ liệu đối tác...</p>
            </div>
        );
    }

    if (!partner) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Không tìm thấy thông tin đối tác</p>
                <button onClick={() => navigate('/referral-partners')} className="text-indigo-600 font-bold mt-4 underline">
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const tabs = [
        { id: 'opportunities', label: 'Cơ hội', count: stats?.totalOpportunities || 0, icon: Briefcase },
        { id: 'contracts', label: 'Hợp đồng', count: stats?.totalContracts || 0, icon: FileText },
        { id: 'customers', label: 'Khách hàng', count: stats?.totalCustomers || 0, icon: Users },
        { id: 'additional', label: 'Thông tin thêm', icon: Info },
    ];


    return (
        <div className="animate-in fade-in duration-700 space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/referral-partners')}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 text-gray-400 hover:text-indigo-600 transition-all group"
                    >
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{partner.name}</h1>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {PARTNER_TYPE_LABELS[partner.type] || partner.type}
                            </span>
                        </div>
                    </div>
                </div>
            </div>



            {/* Content Section: Info & Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-8 gap-8">
                {/* Left Side: Partner Info Card */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 space-y-8 relative overflow-hidden">
                        <div>
                            <div className="flex justify-between items-start mb-6 pb-2 border-b-2 border-indigo-600">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest w-fit">Thông tin đối tác</h3>
                                {canEdit && (
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={isUpdating}
                                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                                                    title="Lưu"
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                                    title="Hủy"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleEdit}
                                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                                title="Sửa thông tin"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                {isEditing ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Input
                                            label="Tên đối tác"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                        <div className="w-full">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại hình</label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                            >
                                                {Object.entries(PARTNER_TYPE_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Input
                                            label={formData.type === 'BUSINESS' ? 'Mã số thuế' : 'CCCD'}
                                            name="taxId"
                                            value={formData.taxId}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            label="Email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            label="Số điện thoại"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm min-h-[80px]"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
                                                <Building2 size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">
                                                    {partner.type === 'BUSINESS' ? 'Mã số thuế' : 'CCCD'}
                                                </p>
                                                <p className="text-sm font-bold text-gray-700">{partner.taxId || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
                                                <Mail size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Email</p>
                                                <p className="text-sm font-bold text-gray-700">{partner.email || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
                                                <Phone size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Số điện thoại</p>
                                                <p className="text-sm font-bold text-gray-700">{partner.phone || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Địa chỉ</p>
                                                <p className="text-sm font-bold text-gray-700 leading-relaxed">{partner.address || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Side: Tab Lists */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm w-fit">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-black transition-all duration-500",
                                        isActive
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105"
                                            : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    )}
                                >
                                    <Icon size={18} />
                                    <span className="uppercase tracking-wider">{tab.label}</span>
                                    {tab.count !== undefined && (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-lg text-[10px] font-black transition-colors",
                                            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                        )}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>

                            );
                        })}
                    </div>

                    {/* Tab Content Cards */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/20 flex justify-between items-center">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Danh sách {tabs.find(t => t.id === activeTab).label}</h4>
                        </div>

                        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {activeTab === 'opportunities' && (
                                partner.opportunities?.length > 0 ? (
                                    partner.opportunities.map((opp) => (
                                        <div key={opp.id} className="p-6 hover:bg-gray-50/30 transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform duration-500 shadow-sm border border-indigo-100">
                                                    <Briefcase size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-gray-900 mb-0.5 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{opp.name}</h5>
                                                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
                                                        <span className="flex items-center gap-1.5">Doanh thu: {formatCurrency(opp.expectedRevenue)}</span>
                                                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/opportunities/${opp.id}`)}
                                                className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                            >
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center justify-center">
                                        <Briefcase className="w-12 h-12 text-gray-100 mb-4" />
                                        <p className="text-gray-400 font-bold italic text-sm">Chưa có cơ hội nào từ đối tác này</p>
                                    </div>
                                )
                            )}

                            {activeTab === 'contracts' && (
                                partner.contracts?.length > 0 ? (
                                    partner.contracts.map((contract) => (
                                        <div key={contract.id} className="p-6 hover:bg-gray-50/30 transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform duration-500 shadow-sm border border-emerald-100">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-gray-900 mb-0.5 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{contract.contractCode || `#${contract.id}`}</h5>
                                                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
                                                        <span className="flex items-center gap-1.5"><DollarSign size={12} className="text-gray-300" /> Giá trị: {formatCurrency(contract.sellingPrice)}</span>
                                                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                        <span className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-300" /> Ngày ký: {formatDate(contract.signedDate)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/contracts/${contract.id}`)}
                                                className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                            >
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center justify-center">
                                        <FileText className="w-12 h-12 text-gray-100 mb-4" />
                                        <p className="text-gray-400 font-bold italic text-sm">Chưa có hợp đồng nào được ký kết</p>
                                    </div>
                                )
                            )}

                            {activeTab === 'customers' && (
                                partner.customers?.length > 0 ? (
                                    partner.customers.map((customer) => (
                                        <div key={customer.id} className="p-6 hover:bg-gray-50/30 transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform duration-500 shadow-sm border border-blue-100">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{customer.name}</h5>
                                                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
                                                        <span className="flex items-center gap-1.5"><Mail size={12} className="text-gray-300" /> {customer.email}</span>
                                                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                        <span className="flex items-center gap-1.5"><Phone size={12} className="text-gray-300" /> {customer.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/customers/${customer.id}`)}
                                                className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                            >
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center justify-center">
                                        <Users className="w-12 h-12 text-gray-100 mb-4" />
                                        <p className="text-gray-400 font-bold italic text-sm">Chưa có dữ liệu khách hàng</p>
                                    </div>
                                )
                            )}

                            {activeTab === 'additional' && (
                                <div className="p-6">
                                    <AdditionalInfo data={partner} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
