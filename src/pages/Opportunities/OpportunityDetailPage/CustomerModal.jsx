import { X } from 'lucide-react';

export const CustomerModal = ({
  isOpen,
  onClose,
  customerType,
  setCustomerType,
  customerStatus,
  setCustomerStatus,
  selectedReferralPartner,
  setSelectedReferralPartner,
  selectedCustomerId,
  setSelectedCustomerId,
  leadInfo,
  setLeadInfo,
  referralPartners,
  customers,
  onSave,
  isUpdating
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Thêm thông tin khách hàng</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Loại khách hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại khách hàng:
            </label>
            <select
              value={customerType}
              onChange={(e) => {
                setCustomerType(e.target.value);
                setCustomerStatus('');
                setSelectedReferralPartner('');
                setSelectedCustomerId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DIRECT">Khách hàng trực tiếp</option>
              <option value="REFERRAL">Khách hàng liên kết</option>
            </select>
          </div>

          {/* Đối tác giới thiệu */}
          {customerType === 'REFERRAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đối tác giới thiệu:
              </label>
              <select
                value={selectedReferralPartner}
                onChange={(e) => setSelectedReferralPartner(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Chọn đối tác giới thiệu --</option>
                {referralPartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name} {partner.taxId ? `- ${partner.taxId}` : ''}
                  </option>
                ))}
              </select>
              {customerType === 'REFERRAL' && !selectedReferralPartner && (
                <p className="text-sm text-orange-600 mt-1">Vui lòng chọn đối tác giới thiệu trước</p>
              )}
            </div>
          )}

          {/* Trạng thái khách hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái khách hàng:
            </label>
            <select
              value={customerStatus}
              onChange={(e) => {
                setCustomerStatus(e.target.value);
                setSelectedCustomerId('');
              }}
              disabled={customerType === 'REFERRAL' && !selectedReferralPartner}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Chọn trạng thái --</option>
              <option value="POTENTIAL">Khách hàng tiềm năng</option>
              <option value="EXISTING">Khách hàng hiện hữu</option>
            </select>
          </div>

          {/* Chọn khách hàng hiện hữu */}
          {customerStatus === 'EXISTING' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn khách hàng hiện hữu:
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.taxId ? `- ${customer.taxId}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form nhập thông tin khách hàng tiềm năng */}
          {customerStatus === 'POTENTIAL' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên khách hàng:
                </label>
                <input
                  type="text"
                  value={leadInfo.leadName}
                  onChange={(e) => setLeadInfo({ ...leadInfo, leadName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên khách hàng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điện thoại:
                </label>
                <input
                  type="text"
                  value={leadInfo.leadPhone}
                  onChange={(e) => setLeadInfo({ ...leadInfo, leadPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email:
                </label>
                <input
                  type="email"
                  value={leadInfo.leadEmail}
                  onChange={(e) => setLeadInfo({ ...leadInfo, leadEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CMND/Hộ chiếu:
                </label>
                <input
                  type="text"
                  value={leadInfo.leadIdNumber}
                  onChange={(e) => setLeadInfo({ ...leadInfo, leadIdNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập CMND/Hộ chiếu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã số thuế:
                </label>
                <input
                  type="text"
                  value={leadInfo.leadTaxId}
                  onChange={(e) => setLeadInfo({ ...leadInfo, leadTaxId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập mã số thuế"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ:
                </label>
                <textarea
                  value={leadInfo.leadAddress}
                  onChange={(e) => setLeadInfo({ ...leadInfo, leadAddress: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onSave}
            disabled={isUpdating || !customerStatus || (customerStatus === 'EXISTING' && !selectedCustomerId) || (customerType === 'REFERRAL' && !selectedReferralPartner)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isUpdating ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};
