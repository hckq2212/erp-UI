import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ProjectCard } from './ProjectCard';

export const ProjectColumn = ({ id, title, count, projects }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col h-full max-h-full">
      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-t-lg border-b border-gray-200">
        <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
        <span className="bg-white text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-200">
          {count}
        </span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className="flex-1 bg-gray-50 p-2 overflow-y-auto min-h-[150px] rounded-b-lg border border-t-0 border-gray-200"
      >
        <SortableContext id={id} items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </SortableContext>
        {projects.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs italic p-4">
                Kéo thả vào đây
            </div>
        )}
      </div>
    </div>
  );
};
