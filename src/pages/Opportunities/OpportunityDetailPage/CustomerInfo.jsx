import { useState, useEffect } from 'react';
import { User, Phone, Mail, Hash, MapPin, Plus, Edit2, Save, X } from 'lucide-react';
import { useUpdateCustomerMutation } from '../../../api/customers';
import { useUpdateOpportunityMutation } from '../../../api/opportunities';
import { toast } from 'react-toastify';

export const CustomerInfo = ({ opportunity, onAddCustomer }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updateCustomer, { isLoading: isUpdatingCustomer }] = useUpdateCustomerMutation();
  const [updateOpportunity, { isLoading: isUpdatingOpportunity }] = useUpdateOpportunityMutation();

  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    email: '',
    taxId: '',
    address: ''
  });

  const hasData = !!(opportunity.customer || opportunity.leadName);
  const isLead = !opportunity.customer && !!opportunity.leadName;

  useEffect(() => {
    if (opportunity.customer) {
      setEditData({
        name: opportunity.customer.name,
        phone: opportunity.customer.phoneNumber || opportunity.customer.phone || '',
        email: opportunity.customer.email || '',
        taxId: opportunity.customer.taxId || '',
        address: opportunity.customer.address || ''
      });
    } else if (opportunity.leadName) {
      setEditData({
        name: opportunity.leadName,
        phone: opportunity.leadPhone || '',
        email: opportunity.leadEmail || '',
        taxId: opportunity.leadTaxId || '',
        address: opportunity.leadAddress || ''
      });
    }
  }, [opportunity, isEditing]);

  const handleSave = async () => {
    try {
      if (opportunity.customer) {
        await updateCustomer({
          id: opportunity.customerId,
          phoneNumber: editData.phone,
          email: editData.email,
          taxId: editData.taxId,
          address: editData.address
        }).unwrap();
      } else {
        await updateOpportunity({
          id: opportunity.id,
          leadName: editData.name,
          leadPhone: editData.phone,
          leadEmail: editData.email,
          leadTaxId: editData.taxId,
          leadAddress: editData.address
        }).unwrap();
      }
      toast.success('Cập nhật thông tin thành công');
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Cập nhật thất bại');
    }
  };

  const renderField = (label, icon, value, name, type = 'text') => {
    const Icon = icon;
    return (
      <div className="space-y-1">
        <p className="text-xs text-gray-500 flex items-center gap-1.5 px-0.5">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </p>
        {isEditing ? (
          name === 'address' ? (
            <textarea
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              value={editData[name]}
              onChange={(e) => setEditData({ ...editData, [name]: e.target.value })}
              rows={2}
            />
          ) : (
            <input
              type={type}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={editData[name]}
              onChange={(e) => setEditData({ ...editData, [name]: e.target.value })}
              disabled={name === 'name' && !isLead}
            />
          )
        ) : (
          <p className="font-medium text-gray-900 px-0.5">{value || '—'}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Thông tin khách hàng</h2>
        </div>
        {hasData && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isUpdatingCustomer || isUpdatingOpportunity}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                  title="Lưu"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Hủy"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Chỉnh sửa
              </button>
            )}
          </div>
        )}
      </div>

      {hasData ? (
        <div className="space-y-4">
          {renderField(isLead ? 'Khách hàng tiềm năng' : 'Khách hàng', User, editData.name, 'name')}
          {renderField('Điện thoại', Phone, editData.phone, 'phone')}
          {renderField('Email', Mail, editData.email, 'email', 'email')}
          {renderField('Mã số thuế', Hash, editData.taxId, 'taxId')}
          {renderField('Địa chỉ', MapPin, editData.address, 'address')}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-4">Chưa có thông tin khách hàng</p>
          <button
            onClick={onAddCustomer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Thêm thông tin
          </button>
        </div>
      )}
    </div>
  );
};
