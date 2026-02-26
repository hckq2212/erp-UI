import { useGetJobsQuery } from '../../api/jobs';
import { formatCurrency } from '../../utils/format';
import { Plus, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useState, useMemo } from 'react';
import { CreateJobModal } from './CreateJobModal';
import { useNavigate } from 'react-router-dom';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../../components/ui/Pagination';
import { TableFilters } from '../../components/ui/TableFilters';
import { cn } from '../../utils/cn';

export const JobsPage = () => {
    const navigate = useNavigate();
    const { data: jobsData = [], isLoading } = useGetJobsQuery();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const jobs = useMemo(() => {
        const rawData = Array.isArray(jobsData) ? jobsData : (jobsData?.data || []);
        return rawData.filter(job =>
            (job.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (job.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [jobsData, searchTerm]);

    const {
        data: paginatedJobs,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(jobs, { initialSort: { key: 'code', direction: 'ascending' } });

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
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>Quản Lý Hạng Mục Dịch Vụ</h1>
                    <p className="text-gray-500 text-sm mt-1">Danh sách chi tiết các hạng mục công việc</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Hạng Mục
                </Button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue="ALL"
                onFilterChange={() => { }}
                filterOptions={[]}
                searchPlaceholder="Tìm mã hạng mục, tên hạng mục..."
                onReset={handleReset}
            />

            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách hạng mục...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        {renderSortableHeader('Mã Hạng Mục', 'code')}
                                        {renderSortableHeader('Tên Hạng Mục', 'name')}
                                        {renderSortableHeader('Giá vốn', 'costPrice')}
                                        {renderSortableHeader('Vinicoin', 'vinicoin')}
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Xem chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedJobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-blue-600 font-bold">{job.code}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{job.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-bold">{formatCurrency(job.costPrice)}</td>
                                            <td className="px-6 py-4 text-sm text-orange-600 font-bold">{job.vinicoin || 0}</td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <button
                                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                                    className="text-white bg-blue-600 rounded-xl px-4 py-1.5 font-bold hover:bg-blue-700 transition-all shadow-sm"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {jobs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-16 text-center text-gray-400 italic">
                                                Không tìm thấy hạng mục công việc nào
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

            <CreateJobModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
