import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={cn("p-3 rounded-full", colorClasses[color] || colorClasses.blue)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {(trend !== undefined && trendValue) && (
        <div className="mt-4 flex items-center text-sm">
          {trend === 'up' ? (
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={trend === 'up' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {trendValue}
          </span>
          <span className="text-gray-500 ml-2">so với tháng trước</span>
        </div>
      )}
    </div>
  );
};
