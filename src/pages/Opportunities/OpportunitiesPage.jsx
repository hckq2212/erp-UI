import { useState, useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from '../../components/opportunities/KanbanColumn';
import { KanbanCard } from '../../components/opportunities/KanbanCard';
import { OpportunityTable } from './OpportunityTable';
import { Button } from '../../components/ui/Button';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useGetOpportunitiesQuery, useUpdateOpportunityMutation } from '../../api/opportunities';
import { OpportunityModal } from './OpportunityModal';
import { cn } from '../../utils/cn';
import { TableFilters } from '../../components/ui/TableFilters';

const COLUMNS = [
    { id: 'OPEN', title: 'Mới' },
    { id: 'PENDING_OPP_APPROVAL', title: 'Đang chờ duyệt' },
    { id: 'OPP_APPROVED', title: 'Đã Duyệt' },
    { id: 'QUOTATION', title: 'Báo Giá' },
    { id: 'QUOTATION_DRAFTING', title: 'Đang làm báo giá' },
    { id: 'PENDING_QUOTE_APPROVAL', title: 'Chờ duyệt báo giá' },
    { id: 'QUOTE_APPROVED', title: 'Đã duyệt báo giá' },
    { id: 'CONTRACT_CREATED', title: 'Đã tạo hợp đồng' },
    { id: 'PROJECT_ASSIGNED', title: 'Đã giao dự án' },
    { id: 'IMPLEMENTATION', title: 'Triển Khai' }
];

export const OpportunitiesPage = () => {
    const { data: opportunitiesData, isLoading } = useGetOpportunitiesQuery();
    const [updateOpportunity] = useUpdateOpportunityMutation();
    const [activeId, setActiveId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewType, setViewType] = useState('kanban'); // 'kanban' | 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const rawOpportunities = Array.isArray(opportunitiesData) ? opportunitiesData : (opportunitiesData?.data || []);

    const opportunities = useMemo(() => {
        return rawOpportunities.filter(opp => {
            const matchesSearch =
                (opp.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (opp.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (opp.leadName?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || opp.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [rawOpportunities, searchTerm, statusFilter]);

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
    };

    const statusOptions = COLUMNS.map(col => ({ value: col.id, label: col.title }));

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeItem = rawOpportunities.find(item => item.id === activeId);

        if (!activeItem) return;

        if (COLUMNS.find(col => col.id === overId) && activeItem.status !== overId) {
            updateOpportunity({ id: activeId, status: overId });
        }

        setActiveId(null);
    };

    const activeItem = activeId ? rawOpportunities.find(i => i.id === activeId) : null;

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách cơ hội...</p>
        </div>
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center space-x-6">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản Lý Cơ Hội</h1>
                    <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
                        <button
                            onClick={() => setViewType('kanban')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewType === 'kanban' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <LayoutGrid className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewType('list')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewType === 'list' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <List className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-blue-500/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo Cơ Hội Mới
                </Button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue={statusFilter}
                onFilterChange={setStatusFilter}
                filterOptions={statusOptions}
                searchPlaceholder="Tìm tên cơ hội, khách hàng..."
                onReset={handleReset}
            />

            {/* Modal */}
            <OpportunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => setIsModalOpen(false)}
            />

            <div className="flex-1 overflow-auto">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
                    {viewType === 'kanban' ? (
                        <div className="flex-1 overflow-x-auto overflow-y-hidden h-full">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCorners}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="flex h-full space-x-4 pb-4 min-w-max">
                                    {COLUMNS.map(col => (
                                        <KanbanColumn
                                            key={col.id}
                                            id={col.id}
                                            title={col.title}
                                            count={opportunities.filter(o => o.status === col.id).length}
                                            opportunities={opportunities.filter(o => o.status === col.id)}
                                        />
                                    ))}
                                </div>

                                <DragOverlay>
                                    {activeItem ? <KanbanCard opportunity={activeItem} /> : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    ) : (
                        <OpportunityTable
                            opportunities={opportunities}
                            onEdit={(opp) => {
                                // Logic for editing could be added here
                                console.log('Editing:', opp.name);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
