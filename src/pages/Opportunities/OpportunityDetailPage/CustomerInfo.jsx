import { User, Phone, Mail, Hash, MapPin, Plus } from 'lucide-react';

export const CustomerInfo = ({ opportunity, onAddCustomer }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Thông tin khách hàng</h2>
        </div>
        <button
          onClick={onAddCustomer}
          className="flex items-center gap-1 text-sm border rounded-sm p-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          Thêm thông tin
        </button>
      </div>

      {opportunity.customer ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Khách hàng</p>
            <p className="font-medium text-gray-900">{opportunity.customer.name}</p>
            {opportunity.customer.taxId && (
              <p className="text-sm text-gray-500">Mã số thuế: {opportunity.customer.taxId}</p>
            )}
          </div>
          {opportunity.customer.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{opportunity.customer.phone}</span>
            </div>
          )}
          {opportunity.customer.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{opportunity.customer.email}</span>
            </div>
          )}
        </div>
      ) : opportunity.leadName ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Khách hàng tiềm năng</p>
            <p className="font-medium text-gray-900">{opportunity.leadName}</p>
          </div>
          {opportunity.leadPhone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{opportunity.leadPhone}</span>
            </div>
          )}
          {opportunity.leadEmail && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{opportunity.leadEmail}</span>
            </div>
          )}
          {opportunity.leadTaxId && (
            <div className="flex items-center gap-2 text-gray-600">
              <Hash className="w-4 h-4" />
              <span>Mã số thuế: {opportunity.leadTaxId}</span>
            </div>
          )}
          {opportunity.leadAddress && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{opportunity.leadAddress}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm mb-3">Chưa có thông tin khách hàng</p>
          <button
            onClick={onAddCustomer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Thêm khách hàng
          </button>
        </div>
      )}
    </div>
  );
};
