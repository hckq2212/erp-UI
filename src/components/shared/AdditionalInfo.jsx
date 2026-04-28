import React from 'react';
import { Clock, User, Calendar, Info } from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import { cn } from '../../utils/cn';

/**
 * AdditionalInfo Component
 * Displays metadata like createdAt, updatedAt, createdBy, and updatedBy
 * 
 * @param {Object} data - The entity data object
 * @param {string} className - Additional CSS classes
 */
export const AdditionalInfo = ({ data, className }) => {
  if (!data) return null;

  const infoItems = [
    {
      label: 'Ngày tạo',
      value: formatDateTime(data.createdAt),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Người tạo',
      value: data.createdBy?.fullName || data.createdBy?.name || 'Hệ thống',
      icon: User,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Cập nhật cuối',
      value: formatDateTime(data.updatedAt),
      icon: Clock,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Người cập nhật',
      value: data.updatedBy?.fullName || data.updatedBy?.name || 'Hệ thống',
      icon: User,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className={cn("animate-in fade-in slide-in-from-bottom-5 duration-700", className)}>
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/20 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
            <Info size={16} />
          </div>
          <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Thông tin hệ thống</h4>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {infoItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start gap-4 group">
                <div className={cn(
                  "p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 shadow-sm border border-transparent group-hover:border-current/10",
                  item.bgColor,
                  item.color
                )}>
                  <Icon size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider leading-none">{item.label}</p>
                  <p className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors uppercase tracking-tight">
                    {item.value || '---'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
