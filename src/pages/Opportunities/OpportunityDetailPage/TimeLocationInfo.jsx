import { Calendar, MapPin, Clock } from 'lucide-react';

const REGION_LABELS = {
  NATIONAL: 'Toàn quốc',
  NORTH: 'Miền Bắc',
  CENTRAL: 'Miền Trung',
  SOUTH: 'Miền Nam'
};

export const TimeLocationInfo = ({ opportunity, formatDate }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Calendar className="w-5 h-5 text-purple-600" />
        <h2 className="font-semibold text-gray-900">Thời gian & Địa điểm</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Dự kiến khởi công</p>
          <p className="font-medium text-gray-900">{formatDate(opportunity.startDate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Dự kiến kết thúc</p>
          <p className="font-medium text-gray-900">{formatDate(opportunity.endDate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Vùng miền
          </p>
          <p className="font-medium text-gray-900">
            {Array.isArray(opportunity.region)
              ? opportunity.region.join(', ')
              : (REGION_LABELS[opportunity.region] || opportunity.region || 'Chưa xác định')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Thời gian triển khai
          </p>
          <p className="font-medium text-gray-900">{opportunity.durationMonths || 0} tháng</p>
        </div>
      </div>
    </div>
  );
};
