import { TrendingUp } from 'lucide-react';
import { formatNumber } from '../../../utils/format';

export const FinancialInfo = ({ opportunity }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h2 className="font-semibold text-gray-900">Thông tin tài chính</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
          <p className="text-sm text-green-700 mb-1">Doanh thu kỳ vọng</p>
          <p className="text-2xl font-bold text-green-800">
            {formatNumber(opportunity.expectedRevenue)} <span className="text-sm font-normal">VNĐ</span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700 mb-1">Ngân sách dự kiến</p>
          <p className="text-2xl font-bold text-blue-800">
            {formatNumber(opportunity.budget)} <span className="text-sm font-normal">VNĐ</span>
          </p>
        </div>
      </div>
    </div>
  );
};
