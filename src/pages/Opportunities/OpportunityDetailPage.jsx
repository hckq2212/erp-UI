import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Target, 
  FileText, 
  Briefcase,
  Clock,
  User,
  Phone,
  Mail,
  Hash,
  ExternalLink,
  Download,
  Edit,
  Trash2,
  Plus,
  X,
  UserPlus
} from 'lucide-react';
import { useGetOpportunityQuery, useDeleteOpportunityMutation, useUpdateOpportunityMutation } from '../../api/opportunities';
import { useGetCustomersQuery } from '../../api/customers';
import { formatNumber } from '../../utils/format';

const PRIORITY_LABELS = {
  Low: 'Thấp',
  Medium: 'Trung bình', 
  High: 'Cao'
};

const PRIORITY_COLORS = {
  Low: 'bg-green-100 text-green-800 border-green-200',
  Medium: 'bg-orange-100 text-orange-800 border-orange-200',
  High: 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_LABELS = {
  OPEN: 'Mới',
  PENDING: 'Đang Xử Lý',
  APPROVED: 'Đã Duyệt',
  QUOTATION: 'Báo Giá',
  QUOTED: 'Đã Gửi BG',
  CONTRACT: 'Hợp Đồng',
  IMPLEMENTATION: 'Triển Khai'
};

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  QUOTATION: 'bg-purple-100 text-purple-800',
  QUOTED: 'bg-indigo-100 text-indigo-800',
  CONTRACT: 'bg-cyan-100 text-cyan-800',
  IMPLEMENTATION: 'bg-emerald-100 text-emerald-800'
};

const REGION_LABELS = {
  NATIONAL: 'Toàn quốc',
  NORTH: 'Miền Bắc',
  CENTRAL: 'Miền Trung',
  SOUTH: 'Miền Nam'
};

const FIELD_LABELS = {
  CNTT: 'Công nghệ thông tin',
  XayDung: 'Xây dựng',
  SanXuat: 'Sản xuất',
  ThuongMai: 'Thương mại',
  DichVu: 'Dịch vụ',
  GiaoDuc: 'Giáo dục',
  YTe: 'Y tế',
  Khac: 'Khác'
};

export const OpportunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: opportunity, isLoading, error } = useGetOpportunityQuery(id);
  const [deleteOpportunity, { isLoading: isDeleting }] = useDeleteOpportunityMutation();
  const [updateOpportunity, { isLoading: isUpdating }] = useUpdateOpportunityMutation();
  
  // Modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [customerType, setCustomerType] = useState('DIRECT'); // DIRECT | REFERRAL
  const [customerStatus, setCustomerStatus] = useState(''); // POTENTIAL | EXISTING
  const [selectedReferralPartner, setSelectedReferralPartner] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [leadInfo, setLeadInfo] = useState({
    leadName: '',
    leadPhone: '',
    leadEmail: '',
    leadIdNumber: '',
    leadTaxId: '',
    leadAddress: ''
  });
  
  // Fetch customers for dropdown
  const { data: customers = [] } = useGetCustomersQuery();
  
  // Filter referral partners (customers who can be referral partners)
  const referralPartners = customers.filter(c => c.isReferralPartner);

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cơ hội này?')) {
      try {
        await deleteOpportunity(id).unwrap();
        navigate('/opportunities');
      } catch (err) {
        alert(err?.data?.message || 'Có lỗi xảy ra khi xóa');
      }
    }
  };

  const handleOpenContactModal = () => {
    // Reset form
    setCustomerType('DIRECT');
    setCustomerStatus('');
    setSelectedReferralPartner('');
    setSelectedCustomerId('');
    setLeadInfo({
      leadName: '',
      leadPhone: '',
      leadEmail: '',
      leadIdNumber: '',
      leadTaxId: '',
      leadAddress: ''
    });
    setShowContactModal(true);
  };

  const handleSaveContact = async () => {
    try {
      const formData = new FormData();
      
      if (customerStatus === 'EXISTING') {
        // Chọn khách hàng hiện hữu
        formData.append('customerId', selectedCustomerId);
        // Clear lead info
        formData.append('leadName', '');
        formData.append('leadPhone', '');
        formData.append('leadEmail', '');
        formData.append('leadIdNumber', '');
        formData.append('leadTaxId', '');
        formData.append('leadAddress', '');
        
        if (customerType === 'REFERRAL' && selectedReferralPartner) {
          formData.append('referralPartnerId', selectedReferralPartner);
        }
      } else if (customerStatus === 'POTENTIAL') {
        // Khách hàng tiềm năng - nhập thông tin mới
        formData.append('customerId', '');
        if (leadInfo.leadName) formData.append('leadName', leadInfo.leadName);
        if (leadInfo.leadPhone) formData.append('leadPhone', leadInfo.leadPhone);
        if (leadInfo.leadEmail) formData.append('leadEmail', leadInfo.leadEmail);
        if (leadInfo.leadIdNumber) formData.append('leadIdNumber', leadInfo.leadIdNumber);
        if (leadInfo.leadTaxId) formData.append('leadTaxId', leadInfo.leadTaxId);
        if (leadInfo.leadAddress) formData.append('leadAddress', leadInfo.leadAddress);
        
        if (customerType === 'REFERRAL' && selectedReferralPartner) {
          formData.append('referralPartnerId', selectedReferralPartner);
        }
      }
      
      await updateOpportunity({ id, formData }).unwrap();
      setShowContactModal(false);
    } catch (err) {
      alert(err?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 mb-4">Không tìm thấy cơ hội</p>
        <button
          onClick={() => navigate('/opportunities')}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/opportunities')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại danh sách cơ hội</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {opportunity.opportunityCode}
              </span>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[opportunity.status]}`}>
                {STATUS_LABELS[opportunity.status] || opportunity.status}
              </span>
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${PRIORITY_COLORS[opportunity.priority]}`}>
                {PRIORITY_LABELS[opportunity.priority] || opportunity.priority}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{opportunity.name}</h1>
            {opportunity.description && (
              <p className="text-gray-600 mt-2 max-w-2xl">{opportunity.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/opportunities/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Chỉnh sửa
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin tài chính */}
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

          {/* Thời gian & Địa điểm */}
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
                <p className="font-medium text-gray-900">{REGION_LABELS[opportunity.region] || opportunity.region}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Thời gian triển khai
                </p>
                <p className="font-medium text-gray-900">{opportunity.durationMonths || 0} tháng</p>
              </div>
            </div>
          </div>

          {/* Đánh giá cơ hội */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-5 h-5 text-orange-600" />
              <h2 className="font-semibold text-gray-900">Đánh giá cơ hội</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Lĩnh vực</p>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                  <Briefcase className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">{FIELD_LABELS[opportunity.field] || opportunity.field}</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Độ ưu tiên</p>
                <span className={`inline-flex px-3 py-1.5 rounded-lg font-medium border ${PRIORITY_COLORS[opportunity.priority]}`}>
                  {PRIORITY_LABELS[opportunity.priority] || opportunity.priority}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Khả năng thành công</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        opportunity.successChance >= 70 ? 'bg-green-500' 
                        : opportunity.successChance >= 40 ? 'bg-orange-500' 
                        : 'bg-red-500'
                      }`}
                      style={{ width: `${opportunity.successChance}%` }}
                    />
                  </div>
                  <span className={`text-lg font-bold ${
                    opportunity.successChance >= 70 ? 'text-green-600' 
                    : opportunity.successChance >= 40 ? 'text-orange-500' 
                    : 'text-red-500'
                  }`}>
                    {opportunity.successChance}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tài liệu đính kèm */}
          {opportunity.attachments && opportunity.attachments.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-5 h-5 text-cyan-600" />
                <h2 className="font-semibold text-gray-900">Tài liệu đính kèm</h2>
                <span className="text-sm text-gray-500">({opportunity.attachments.length})</span>
              </div>
              <div className="space-y-3">
                {opportunity.attachments.map((attachment, index) => {
                  // For LINK type, extract readable name from URL
                  const getDisplayName = () => {
                    if (attachment.type === 'FILE') {
                      return attachment.name;
                    }
                    // For LINK, try to show domain or shortened URL
                    try {
                      const url = new URL(attachment.url);
                      if (url.hostname.includes('drive.google.com')) {
                        return 'Google Drive';
                      } else if (url.hostname.includes('docs.google.com')) {
                        return 'Google Docs';
                      } else if (url.hostname.includes('sheets.google.com')) {
                        return 'Google Sheets';
                      } else if (url.hostname.includes('dropbox.com')) {
                        return 'Dropbox';
                      } else if (url.hostname.includes('onedrive')) {
                        return 'OneDrive';
                      }
                      return url.hostname.replace('www.', '');
                    } catch {
                      return attachment.name;
                    }
                  };

                  return (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {attachment.type === 'LINK' ? (
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {getDisplayName()}
                          </p>
                          {attachment.type === 'LINK' && (
                            <p className="text-xs text-gray-500 truncate max-w-md">{attachment.url}</p>
                          )}
                        {attachment.size && (
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </div>
                    {attachment.type === 'FILE' ? (
                      <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    ) : (
                      <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    )}
                  </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Thông tin khách hàng */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Thông tin khách hàng</h2>
              </div>
              <button
                onClick={handleOpenContactModal}
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
                  onClick={handleOpenContactModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Thêm khách hàng
                </button>
              </div>
            )}
          </div>

          {/* Thông tin bổ sung */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Thông tin bổ sung</h2>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày tạo</span>
                <span className="font-medium text-gray-900">{formatDate(opportunity.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cập nhật lần cuối</span>
                <span className="font-medium text-gray-900">{formatDate(opportunity.updatedAt)}</span>
              </div>
              {opportunity.referralPartner && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Đối tác giới thiệu</span>
                  <span className="font-medium text-gray-900">{opportunity.referralPartner.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thêm thông tin khách hàng */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Thêm thông tin khách hàng</h3>
              <button
                onClick={() => setShowContactModal(false)}
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

              {/* Đối tác giới thiệu (chỉ hiện khi chọn Khách hàng liên kết) */}
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
                onClick={handleSaveContact}
                disabled={isUpdating || !customerStatus || (customerStatus === 'EXISTING' && !selectedCustomerId) || (customerType === 'REFERRAL' && !selectedReferralPartner)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityDetailPage;
