import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useGetTeamsQuery } from '../../api/teams';
import { TeamsTable } from '../../components/teams/TeamsTable';
import { Button } from '../../components/ui/Button';
import { TeamModal } from './TeamModal';
import { TableFilters } from '../../components/ui/TableFilters';
import { useGetMeQuery } from '../../api/auth';

export const TeamsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: teamsData, isLoading } = useGetTeamsQuery();
    const { data: user } = useGetMeQuery();
    const canCreateTeam = user?.role === 'ADMIN' || user?.role === 'BOD';

    const teams = useMemo(() => {
        const rawData = Array.isArray(teamsData) ? teamsData : (teamsData?.data || []);
        return rawData.filter(team =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [teamsData, searchTerm]);

    const handleReset = () => {
        setSearchTerm('');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách đội...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Đội Dự Án</h1>
                    <p className="text-gray-500 text-sm mt-1">Quản lý các đội dự án</p>
                </div>
                {canCreateTeam && (
                    <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto shadow-lg shadow-blue-500/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Tạo Đội Mới
                    </Button>
                )}
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue="ALL"
                onFilterChange={() => { }}
                filterOptions={[]}
                onReset={handleReset}
                searchPlaceholder="Tìm tên đội..."
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <TeamsTable teams={teams} />
            </div>

            <TeamModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};
