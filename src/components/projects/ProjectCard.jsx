import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PROJECT_STATUS_COLORS } from '../../utils/enums';

export const ProjectCard = ({ project }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusColors = PROJECT_STATUS_COLORS;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-all mb-3 border-l-4",
        statusColors[project.status] || 'border-l-gray-300',
        isDragging && "opacity-50"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-gray-500">{project.contract?.contractCode || 'N/A'}</span>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2 truncate">{project.name}</h3>
      
      <div className="space-y-2">
        <div className="flex items-center text-gray-600 text-xs">
            <User className="w-3 h-3 mr-2" />
            <span className="truncate">{project.team?.name || 'Chưa phân công'}</span>
        </div>
      </div>
    </div>
  );
};
