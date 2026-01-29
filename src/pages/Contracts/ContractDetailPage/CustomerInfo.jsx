import { Building2 } from 'lucide-react';

export const CustomerInfo = ({ contract }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Building2 className="w-5 h-5 text-blue-600" />
      Thông tin khách hàng
    </h2>
    {contract.customer ? (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-500">Tên khách hàng</label>
          <p className="text-gray-900 mt-1">{contract.customer.name}</p>
        </div>
        {contract.customer.phoneNumber && (
          <div>
            <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
            <p className="text-gray-900 mt-1">{contract.customer.phoneNumber}</p>
          </div>
        )}
        {contract.customer.email && (
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900 mt-1">{contract.customer.email}</p>
          </div>
        )}
      </div>
    ) : (
      <p className="text-gray-500">Chưa có thông tin khách hàng</p>
    )}
  </div>
);
