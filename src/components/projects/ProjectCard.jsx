import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User } from 'lucide-react';
import { cn } from '../../utils/cn';

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

  const statusColors = {
    Planning: 'border-l-blue-500',
    InProgress: 'border-l-yellow-500',
    Completed: 'border-l-green-500',
    OnHold: 'border-l-orange-500',
    Cancelled: 'border-l-red-500',
  };

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
        <span className="text-xs font-mono text-gray-500">{project.code}</span>
        <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">{project.name}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-gray-600 text-sm">
            <User className="w-3 h-3 mr-2" />
            <span className="truncate">{project.customerName}</span>
        </div>
         <div className="flex items-center text-gray-500 text-xs">
            <Calendar className="w-3 h-3 mr-2" />
            <span>{project.startDate} - {project.endDate}</span>
        </div>
      </div>
    </div>
  );
};
