import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetServicePackagesQuery } from '../../api/servicePackages';
import { Plus, Search, Package, ChevronRight, Briefcase } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { CreateServicePackageModal } from './CreateServicePackageModal';

export const ServicePackageListPage = () => {
    const navigate = useNavigate();
    const { data: packagesData = [], isLoading } = useGetServicePackagesQuery();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const packages = useMemo(() => {
        const rawData = Array.isArray(packagesData) ? packagesData : (packagesData?.data || []);
        return rawData.filter(pkg =>
            (pkg.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (pkg.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [packagesData, searchTerm]);

    const {
        data: paginatedPackages,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(packages, { itemsPerPage: 12 });

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                    <h1 className='text-3xl font-black text-gray-900 tracking-tight uppercase'>Gói dịch vụ</h1>
                    <p className="text-gray-500 mt-1 font-medium">Quản lý các gói dịch vụ mẫu để tạo cơ hội nhanh chóng</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Gói dịch vụ
                </Button>
            </div>

            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tên gói hoặc mô tả..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 h-48 animate-pulse shadow-sm">
                            <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
                            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-10"></div>
                            <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                        </div>
                    ))}
                </div>
            ) : paginatedPackages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedPackages.map((pkg) => (
                        <div
                            key={pkg.id}
                            className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Package className="w-24 h-24 text-blue-600 rotate-12" />
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100 group-hover:border-blue-100 group-hover:text-blue-600 transition-all">
                                        {pkg.items?.length || 0} Dịch vụ
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase">
                                    {pkg.name}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                                    {pkg.description || 'Không có mô tả'}
                                </p>
                            </div>

                            <button
                                onClick={() => navigate(`/service-packages/${pkg.id}`)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-700 font-bold rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm"
                            >
                                <span className="text-sm">Xem chi tiết</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-medium italic">Không tìm thấy gói dịch vụ nào</p>
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
            />

            <CreateServicePackageModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
