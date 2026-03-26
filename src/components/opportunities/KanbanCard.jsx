import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, User, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import { PRIORITY_LABELS, PRIORITY_COLORS, PRIORITY_INDICATOR_COLORS } from '../../utils/enums';
export const KanbanCard = ({ opportunity }) => {
  const navigate = useNavigate();
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

  const handleClick = (e) => {
    // Prevent navigation when dragging
    if (isDragging) return;
    navigate(`/opportunities/${opportunity.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        "bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all mb-3 border-l-4",
        PRIORITY_INDICATOR_COLORS[opportunity.priority] || 'border-l-gray-300',
        isDragging && "opacity-50 cursor-grabbing"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-gray-500">{opportunity.opportunityCode}-{opportunity.name}</span>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border shadow-sm", PRIORITY_COLORS[opportunity.priority] || 'bg-gray-100')}>
            {PRIORITY_LABELS[opportunity.priority] || opportunity.priority}
        </span>
      </div>
      
      <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{opportunity.name}</h4>
      
      <div className="space-y-1 text-xs text-gray-600 mb-3">
        <div className="flex items-center">
            <User className="h-3 w-3 mr-1.5 text-gray-400" />
            <span className="truncate">{opportunity.customer?.name || opportunity.leadName || 'Chưa có KH'}</span>
        </div>
        <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1.5 text-gray-400" />
            <span className="font-medium text-blue-600">{formatNumber(opportunity.expectedRevenue)} VNĐ</span>
        </div>
         <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1.5 text-gray-400" />
            <span>{opportunity.endDate ? new Date(opportunity.endDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}</span>
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
