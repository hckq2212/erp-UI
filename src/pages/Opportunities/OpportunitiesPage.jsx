import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from '../../components/opportunities/KanbanColumn';
import { KanbanCard } from '../../components/opportunities/KanbanCard';
import { Button } from '../../components/ui/Button';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useGetOpportunitiesQuery, useUpdateOpportunityMutation } from '../../api/opportunities';

const COLUMNS = [
    { id: 'Open', title: 'Mới (Open)' },
    { id: 'Pending', title: 'Đang Xử Lý' },
    { id: 'Approved', title: 'Đã Duyệt' },
    { id: 'Quotation', title: 'Báo Giá' },
    { id: 'Quote', title: 'Đã Gửi BG' },
    { id: 'Contract', title: 'Hợp Đồng' },
    { id: 'Impl', title: 'Triển Khai' }
];

export const OpportunitiesPage = () => {
    const { data: opportunitiesData, isLoading } = useGetOpportunitiesQuery();
    const [updateOpportunity] = useUpdateOpportunityMutation();
    const [activeId, setActiveId] = useState(null);

    const opportunities = Array.isArray(opportunitiesData) ? opportunitiesData : (opportunitiesData?.data || []);

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

        const activeItem = opportunities.find(item => item.id === activeId);
        
        if (!activeItem) return;

        if (COLUMNS.find(col => col.id === overId) && activeItem.status !== overId) {
             updateOpportunity({ id: activeId, status: overId });
        }
        
        setActiveId(null);
    };

    const handleDragOver = (event) => {
        // Implementation for finer sorting within columns could go here
    };

    const activeItem = activeId ? opportunities.find(i => i.id === activeId) : null;

    if (isLoading) return <div className="p-6">Loading opportunities...</div>;

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold text-gray-900">Quản Lý Cơ Hội</h1>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button className="p-1.5 bg-white rounded shadow-sm text-blue-600"><LayoutGrid className="h-4 w-4" /></button>
                        <button className="p-1.5 text-gray-500 hover:text-gray-700"><List className="h-4 w-4" /></button>
                    </div>
                </div>
                <Button>
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo Cơ Hội Mới
                </Button>
            </div>

            {/* Filter Bar would go here */}

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCorners} 
                    onDragStart={handleDragStart} 
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
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
        </div>
    );
};
