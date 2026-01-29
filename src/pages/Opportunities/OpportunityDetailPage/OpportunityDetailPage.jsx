import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react';
import { useGetOpportunityQuery, useDeleteOpportunityMutation, useUpdateOpportunityMutation } from '../../../api/opportunities';
import { useGetCustomersQuery } from '../../../api/customers';
import { useGetQuotationsByOpportunityQuery, useCreateQuotationMutation, useUpdateQuotationMutation } from '../../../api/quotations';
import { useCreateContractMutation } from '../../../api/contracts';
import { QuotationModal } from './QuotationModal';
import { toast } from 'react-toastify';
import { FinancialInfo } from './FinancialInfo';
import { TimeLocationInfo } from './TimeLocationInfo';
import { OpportunityEvaluation } from './OpportunityEvaluation';
import { AttachmentsList } from './AttachmentsList';
import { CustomerInfo } from './CustomerInfo';
import { AdditionalInfo } from './AdditionalInfo';
import { QuotationsListModal } from './QuotationsListModal';
import { CustomerModal } from './CustomerModal';

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

export const OpportunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: opportunity, isLoading, error } = useGetOpportunityQuery(id);
  const [deleteOpportunity, { isLoading: isDeleting }] = useDeleteOpportunityMutation();
  const [updateOpportunity, { isLoading: isUpdating }] = useUpdateOpportunityMutation();
  const [createQuotation] = useCreateQuotationMutation();
  const [updateQuotation] = useUpdateQuotationMutation();
  const [createContract, { isLoading: isCreatingContract }] = useCreateContractMutation();

  // Modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showQuotationsListModal, setShowQuotationsListModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [customerType, setCustomerType] = useState('DIRECT');
  const [customerStatus, setCustomerStatus] = useState('');
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

  // Fetch quotations for this opportunity
  const { data: quotations = [], isLoading: isLoadingQuotations } = useGetQuotationsByOpportunityQuery(id);

  // Filter referral partners
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
        formData.append('customerId', selectedCustomerId);
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

  const handleQuotationSubmit = async (quotationData, quotationId) => {
    try {
      if (quotationId) {
        // Update existing quotation
        await updateQuotation({
          id: quotationId,
          ...quotationData
        }).unwrap();
        toast.success('Cập nhật báo giá thành công');
      } else {
        // Create new quotation then update with details
        const createResponse = await createQuotation({
          opportunityId: id,
          note: quotationData.note || ''
        }).unwrap();
        
        // Update with details immediately after creation
        await updateQuotation({
          id: createResponse.id,
          ...quotationData
        }).unwrap();
        
        toast.success('Tạo báo giá thành công');
      }
      setShowQuotationModal(false);
      setEditingQuotation(null);
    } catch (err) {
      toast.error(err?.data?.message || `Có lỗi xảy ra khi ${quotationId ? 'cập nhật' : 'tạo'} báo giá`);
    }
  };

  const handleEditQuotation = (quotation) => {
    setEditingQuotation(quotation);
    setShowQuotationsListModal(false);
    setShowQuotationModal(true);
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
              onClick={() => setShowQuotationsListModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Xem báo giá {quotations.length > 0 && `(${quotations.length})`}
            </button>
            <button
              onClick={() => setShowQuotationModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tạo báo giá
            </button>
            {opportunity.status === 'QUOTE_APPROVED' && (
              <button
                onClick={async () => {
                  try {
                    await createContract({ opportunityId: Number(id), name: opportunity.name || `Hợp đồng ${opportunity.opportunityCode}` }).unwrap();
                    toast.success('Tạo hợp đồng thành công');
                  } catch (err) {
                    toast.error(err?.data?.message || 'Tạo hợp đồng thất bại');
                  }
                }}
                disabled={isCreatingContract}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-60"
              >
                {isCreatingContract ? 'Đang tạo...' : 'Tạo hợp đồng'}
              </button>
            )}
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
          <FinancialInfo opportunity={opportunity} formatDate={formatDate} />
          <TimeLocationInfo opportunity={opportunity} formatDate={formatDate} />
          <OpportunityEvaluation opportunity={opportunity} />
          <AttachmentsList attachments={opportunity.attachments} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CustomerInfo opportunity={opportunity} onAddCustomer={handleOpenContactModal} />
          <AdditionalInfo opportunity={opportunity} formatDate={formatDate} />
        </div>
      </div>

      {/* Modals */}
      <QuotationModal
        opportunity={opportunity}
        isOpen={showQuotationModal}
        onClose={() => {
          setShowQuotationModal(false);
          setEditingQuotation(null);
        }}
        onSubmit={handleQuotationSubmit}
        editQuotation={editingQuotation}
      />

      <CustomerModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        customerType={customerType}
        setCustomerType={setCustomerType}
        customerStatus={customerStatus}
        setCustomerStatus={setCustomerStatus}
        selectedReferralPartner={selectedReferralPartner}
        setSelectedReferralPartner={setSelectedReferralPartner}
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        leadInfo={leadInfo}
        setLeadInfo={setLeadInfo}
        referralPartners={referralPartners}
        customers={customers}
        onSave={handleSaveContact}
        isUpdating={isUpdating}
      />

      <QuotationsListModal
        isOpen={showQuotationsListModal}
        onClose={() => setShowQuotationsListModal(false)}
        quotations={quotations}
        isLoading={isLoadingQuotations}
        onCreateNew={() => setShowQuotationModal(true)}
        onEditQuotation={handleEditQuotation}
        opportunity={opportunity}
        formatDate={formatDate}
      />
    </div>
  );
};

export default OpportunityDetailPage;
