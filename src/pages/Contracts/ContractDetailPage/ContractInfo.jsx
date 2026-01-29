import { FileCheck, Calendar } from 'lucide-react';
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '../../../utils/enums';

export const ContractInfo = ({ contract, formatDate }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <FileCheck className="w-5 h-5 text-blue-600" />
      Thông tin hợp đồng
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-gray-500">Mã hợp đồng</label>
        <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded mt-1">
          {contract.contractCode || '—'}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Tên hợp đồng</label>
        <p className="text-gray-900 mt-1">{contract.name || '—'}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
        <p className="text-gray-900 mt-1 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {formatDate(contract.createdAt)}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Trạng thái</label>
        <p className="mt-1">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[contract.status] || 'bg-gray-100 text-gray-800'}`}>
            {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
          </span>
        </p>
      </div>
    </div>
  </div>
);
