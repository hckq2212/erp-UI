import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Briefcase, DollarSign, User, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

export const KanbanCard = ({ opportunity }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    Cao: 'border-l-red-500',
    Trung: 'border-l-yellow-500',
    Thấp: 'border-l-green-500',
  };

  const badgeColors = {
    Cao: 'bg-red-100 text-red-800',
    Trung: 'bg-yellow-100 text-yellow-800',
    Thấp: 'bg-green-100 text-green-800',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-all mb-3 border-l-4",
        priorityColors[opportunity.priority] || 'border-l-gray-300',
        isDragging && "opacity-50"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-gray-500">{opportunity.code}</span>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", badgeColors[opportunity.priority] || 'bg-gray-100')}>
            {opportunity.priority}
        </span>
      </div>
      
      <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{opportunity.name}</h4>
      
      <div className="space-y-1 text-xs text-gray-600 mb-3">
        <div className="flex items-center">
            <User className="h-3 w-3 mr-1.5 text-gray-400" />
            <span className="truncate">{opportunity.customerName}</span>
        </div>
        <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1.5 text-gray-400" />
            <span className="font-medium text-blue-600">{opportunity.expectedRevenue}</span>
        </div>
         <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1.5 text-gray-400" />
            <span>{opportunity.expectedCloseDate}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
         <div className="flex items-center text-xs">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full mr-2">
                <div 
                    className={cn("h-1.5 rounded-full", opportunity.successChance >= 70 ? 'bg-green-500' : opportunity.successChance >= 40 ? 'bg-yellow-500' : 'bg-red-500')} 
                    style={{ width: `${opportunity.successChance}%` }}
                ></div>
            </div>
            <span>{opportunity.successChance}%</span>
         </div>
         {opportunity.assigneeAvatar && (
             <img src={opportunity.assigneeAvatar} alt="Assignee" className="h-6 w-6 rounded-full border border-white shadow-sm" />
         )}
      </div>
    </div>
  );
};
