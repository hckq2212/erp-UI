import { useState } from 'react';
import { ProjectTable } from '../../components/projects/ProjectTable';
import { TableFilters } from '../../components/ui/TableFilters';
import { PROJECT_STATUS_LABELS } from '../../utils/enums';
import { useGetProjectsQuery } from '../../api/projects';

export const ProjectsPage = () => {
    const [filters, setFilters] = useState({
        search: '',
        status: 'ALL',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortDir: 'DESC'
    });

    const { data, isLoading } = useGetProjectsQuery(filters);
    const projects = data?.data || [];
    const meta = data?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (sortBy, sortDir) => {
        setFilters(prev => ({ ...prev, sortBy, sortDir, page: 1 }));
    };

    const handleReset = () => {
        setFilters({
            search: '',
            status: 'ALL',
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortDir: 'DESC'
        });
    };

    const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
        value,
        label
    }));

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách dự án...</p>
        </div>
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản Lý Dự Án</h1>
                    <p className="text-gray-500 text-sm mt-1">Theo dõi và quản lý tiến độ các dự án đang triển khai</p>
                </div>
            </div>

            <TableFilters
                searchTerm={filters.search}
                onSearchChange={(val) => handleFilterChange('search', val)}
                filterValue={filters.status}
                onFilterChange={(val) => handleFilterChange('status', val)}
                filterOptions={statusOptions}
                searchPlaceholder="Tìm tên dự án, mã hợp đồng..."
                onReset={handleReset}
            />

            <div className="flex-1 overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="h-full overflow-y-auto">
                    <ProjectTable
                        projects={projects}
                        meta={meta}
                        onPageChange={handlePageChange}
                        onSortChange={handleSortChange}
                        currentSort={{ sortBy: filters.sortBy, sortDir: filters.sortDir }}
                        onView={(p) => alert(`View ${p.name}`)}
                        onEdit={(p) => alert(`Edit ${p.name}`)}
                        onDelete={(id) => alert(`Delete ${id}`)}
                    />
                </div>
            </div>
        </div>
    );
};

