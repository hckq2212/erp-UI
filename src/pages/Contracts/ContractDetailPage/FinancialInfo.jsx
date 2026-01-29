import { DollarSign } from 'lucide-react';

export const FinancialInfo = ({ contract }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <DollarSign className="w-5 h-5 text-green-600" />
      Thông tin tài chính
    </h2>
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-500">Giá bán</label>
        <p className="text-2xl font-bold text-green-600 mt-1">
          {Number(contract.sellingPrice || contract.selling_price || 0).toLocaleString('vi-VN')} VNĐ
        </p>
      </div>
      {contract.cost && (
        <div>
          <label className="text-sm font-medium text-gray-500">Chi phí dự kiến</label>
          <p className="text-gray-900 mt-1">
            {Number(contract.cost).toLocaleString('vi-VN')} VNĐ
          </p>
        </div>
      )}
    </div>
  </div>
);
