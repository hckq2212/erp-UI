import { useGetReferralPartnersQuery } from '../../api/referralPartners';
import { Users, Mail, Phone, MapPin, Plus, TrendingUp, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useState, useMemo } from 'react';
import { CreateReferralPartnerModal } from './CreateReferralPartnerModal';
import { PARTNER_TYPE_LABELS } from '../../utils/enums';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../../components/ui/Pagination';
import { TableFilters } from '../../components/ui/TableFilters';
import { cn } from '../../utils/cn';

export const ReferralPartnersPage = () => {
    const navigate = useNavigate();
    const { data: partnersData = [], isLoading } = useGetReferralPartnersQuery();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const partners = useMemo(() => {
        const rawData = Array.isArray(partnersData) ? partnersData : (partnersData?.data || []);
        return rawData.filter(partner => {
            const matchesSearch =
                (partner.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (partner.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (partner.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === 'ALL' || partner.type === typeFilter;

            return matchesSearch && matchesType;
        });
    }, [partnersData, searchTerm, typeFilter]);

    const {
        data: paginatedPartners,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(partners, { initialSort: { key: 'name', direction: 'ascending' } });

    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const renderSortableHeader = (label, sortKey, align = 'left') => (
        <th
            className={cn(
                "px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors group",
                align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
            )}
            onClick={() => requestSort(sortKey)}
        >
            <div className={cn("flex items-center", align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start')}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    const handleReset = () => {
        setSearchTerm('');
        setTypeFilter('ALL');
    };

    const typeOptions = Object.entries(PARTNER_TYPE_LABELS).map(([value, label]) => ({
        value,
        label
    }));

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>Quản Lý Đối Tác</h1>
                    <p className="text-gray-500 text-sm mt-1">Danh sách các đối tác giới thiệu và cộng tác</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Đối Tác
                </Button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue={typeFilter}
                onFilterChange={setTypeFilter}
                filterOptions={typeOptions}
                filterPlaceholder="Tất cả loại đối tác"
                searchPlaceholder="Tìm tên đối tác, email, SĐT..."
                onReset={handleReset}
            />

            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách đối tác...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        {renderSortableHeader('Đối Tác', 'name')}
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Liên hệ</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin</th>
                                        {/* <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thống kê</th> */}
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Xem chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedPartners.map((partner) => (
                                        <tr key={partner.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shadow-sm transition-transform group-hover:scale-105">
                                                        <Users className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{partner.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter/50">{PARTNER_TYPE_LABELS[partner.type] || partner.type || 'Phổ thông'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                                                        <Mail className="h-3 w-3 text-indigo-400" />
                                                        {partner.email || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                        <Phone className="h-3 w-3 text-emerald-400" />
                                                        {partner.phone || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                                                    <MapPin className="h-3 w-3 text-red-300" />
                                                    <span className="truncate max-w-[150px]" title={partner.address}>{partner.address || 'N/A'}</span>
                                                </div>
                                            </td>
                                            {/* <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-[11px] text-indigo-600 font-black uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg w-fit">
                                                    <TrendingUp className="h-3 w-3" />
                                                    <span>Chi tiết</span>
                                                </div>
                                            </td> */}
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/referral-partners/${partner.id}`)}
                                                    className="text-white bg-indigo-600 rounded-xl px-4 py-1.5 font-bold hover:bg-indigo-700 transition-all shadow-sm"
                                                >
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {partners.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-16 text-center text-gray-400 italic font-medium">
                                                Không tìm thấy đối tác nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={totalItems}
                        />
                    </>
                )}
            </div>

            <CreateReferralPartnerModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
