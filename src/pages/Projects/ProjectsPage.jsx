import { useState, useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ProjectTable } from '../../components/projects/ProjectTable';
import { ProjectColumn } from '../../components/projects/ProjectColumn';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { Button } from '../../components/ui/Button';
import { Plus, LayoutGrid, List } from 'lucide-react';

const PROJECT_STATUSES = [
    { id: 'Planning', title: 'Lên Kế Hoạch' },
    { id: 'InProgress', title: 'Đang Thực Hiện' },
    { id: 'OnHold', title: 'Tạm Hoãn' },
    { id: 'Completed', title: 'Hoàn Thành' },
    { id: 'Cancelled', title: 'Đã Hủy' }
];

export const ProjectsPage = () => {
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
    const { data: projectsData, isLoading, refetch } = useProjects();
    const updateProject = useUpdateProject();
    const [activeId, setActiveId] = useState(null);

    // If using real API, projectsData depends on response structure. default to [] 
    const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.data || []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find dragged item
        const activeProject = projects.find(p => p.id === activeId);
        if (!activeProject) return;

        // Check if dropped on a column
        if (PROJECT_STATUSES.find(s => s.id === overId) && activeProject.status !== overId) {
             // Optimistic update locally if we had local state, but here we rely on React Query invalidation
             // or we can manually update cache. For simplicity, just call mutation
             updateProject.mutateAsync({ id: activeId, data: { status: overId } });
        }
        
        setActiveId(null);
    };

    const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

    if (isLoading) return <div className="p-6">Loading projects...</div>;

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold text-gray-900">Quản Lý Dự Án</h1>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button 
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 rounded shadow-sm ${viewMode === 'kanban' ? 'bg-white text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded shadow-sm ${viewMode === 'list' ? 'bg-white text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <Button onClick={() => alert('Add Project Modal')}>
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo Dự Án
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                {viewMode === 'list' ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden h-full overflow-y-auto">
                        <ProjectTable 
                            projects={projects} 
                            onView={(p) => alert(`View ${p.name}`)}
                            onEdit={(p) => alert(`Edit ${p.name}`)}
                            onDelete={(id) => alert(`Delete ${id}`)}
                        />
                    </div>
                ) : (
                    <div className="flex-1 overflow-x-auto overflow-y-hidden h-full">
                         <DndContext 
                            sensors={sensors} 
                            collisionDetection={closestCorners} 
                            onDragStart={handleDragStart} 
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex h-full space-x-4 pb-4 min-w-max">
                                {PROJECT_STATUSES.map(col => (
                                    <ProjectColumn 
                                        key={col.id} 
                                        id={col.id} 
                                        title={col.title} 
                                        count={projects.filter(p => p.status === col.id).length}
                                        projects={projects.filter(p => p.status === col.id)} 
                                    />
                                ))}
                            </div>
                            <DragOverlay>
                                {activeProject ? <ProjectCard project={activeProject} /> : null}
                            </DragOverlay>
                        </DndContext>
                    </div>
                )}
            </div>
        </div>
    );
};

