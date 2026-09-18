import { useSelector } from 'react-redux';
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  FileText,
  Copy,
} from 'lucide-react';
import { selectCurrentUser } from '../../../store/authSlice';
import { useGetOpportunityQuery, useDeleteOpportunityMutation, useUpdateOpportunityMutation, useApproveOpportunityMutation } from '../../../api/opportunities';
import { useGetCustomersQuery } from '../../../api/customers';
import { useGetQuotationsByOpportunityQuery, useCreateQuotationMutation, useUpdateQuotationMutation } from '../../../api/quotations';
import { useGetReferralPartnersQuery, useGetReferralPartnerQuery } from '../../../api/referralPartners';
import { QuotationModal } from './QuotationModal';
import { OpportunityModal } from '../OpportunityModal';
import { toast } from 'react-toastify';
import { FinancialInfo } from './FinancialInfo';
import { TimeLocationInfo } from './TimeLocationInfo';
import { OpportunityEvaluation } from './OpportunityEvaluation';
import { AttachmentsList } from './AttachmentsList';
import { CustomerInfo } from './CustomerInfo';
import { AdditionalInfo } from './AdditionalInfo';
import { QuotationsListModal } from './QuotationsListModal';
import { CustomerModal } from './CustomerModal';
import { OpportunityServicesInfo } from './OpportunityServicesInfo';
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_COLORS
} from '../../../utils/enums';
import { useGetMeQuery } from '../../../api/auth';

export const OpportunityDetailPage = () => {
  const user = useSelector(selectCurrentUser);
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: opportunity, isLoading, error } = useGetOpportunityQuery(id);
  const [deleteOpportunity, { isLoading: isDeleting }] = useDeleteOpportunityMutation();
  const [updateOpportunity, { isLoading: isUpdating }] = useUpdateOpportunityMutation();
  const { data: quotations = [], isLoading: isLoadingQuotations } = useGetQuotationsByOpportunityQuery(id);
  const { data: currentUser = [] } = useGetMeQuery();
  const [createQuotation, { isLoading: isCreatingQuotation }] = useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdatingQuotation }] = useUpdateQuotationMutation();
  const [approveOpportunity, { isLoading: isApproving }] = useApproveOpportunityMutation();

  const draftCount = useMemo(() =>
    quotations.filter(q => q.status === 'DRAFT' || q.status === 'PENDING_APPROVAL').length,
    [quotations]
  );
  console.log(draftCount);
  console.log(opportunity?.status);

  const showBadge = (opportunity?.status === 'PENDING_QUOTE_APPROVAL' || opportunity?.status === 'QUOTATION_DRAFTING') && draftCount > 0;
  const incompleteAiJobs = useMemo(() => (opportunity?.services || []).flatMap(service => {
    if (!service.service?.isAI) return [];

    return (service.jobs || []).filter(job =>
      job.isQuotationItem &&
      !job.isBriefVideo &&
      Number(job.costAtSale || 0) <= 0
    );
  }), [opportunity?.services]);

  // Modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showQuotationsListModal, setShowQuotationsListModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [customerType, setCustomerType] = useState('DIRECT');
  const [customerStatus, setCustomerStatus] = useState('');
  const [selectedReferralPartner, setSelectedReferralPartner] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [leadInfo, setLeadInfo] = useState({
    leadName: '',
    leadPhone: '',
    leadEmail: '',
    leadTaxId: '',
    leadAddress: ''
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useGetCustomersQuery();

  // Fetch quotations for this opportunity
  // const { data: quotations = [], isLoading: isLoadingQuotations } = useGetQuotationsByOpportunityQuery(id);

  // Fetch referral partners
  const { data: referralPartnersResult = [] } = useGetReferralPartnersQuery();
  const referralPartners = Array.isArray(referralPartnersResult) ? referralPartnersResult : (referralPartnersResult?.data || []);

  // Fetch specific referral partner details if one is selected
  const { data: partnerDetails, isLoading: isLoadingPartnerDetails } = useGetReferralPartnerQuery(
    selectedReferralPartner,
    { skip: !selectedReferralPartner || customerType !== 'REFERRAL' }
  );

  // Determine which customer list to pass to the modal
  const displayCustomers = customerType === 'REFERRAL'
    ? (partnerDetails?.customers || [])
    : (Array.isArray(customers) ? customers : (customers?.data || []));


  const handleOpenContactModal = () => {
    setCustomerType('DIRECT');
    setCustomerStatus('');
    setSelectedReferralPartner('');
    setSelectedCustomerId('');
    setLeadInfo({
      leadName: '',
      leadPhone: '',
      leadEmail: '',
      leadTaxId: '',
      leadAddress: ''
    });
    setShowContactModal(true);
  };

  const handleSaveContact = async () => {
    try {
      const updateData = {};

      if (customerStatus === 'EXISTING') {
        updateData.customerId = selectedCustomerId;
        updateData.leadName = '';
        updateData.leadPhone = '';
        updateData.leadEmail = '';
        updateData.leadTaxId = '';
        updateData.leadAddress = '';

        // Map frontend type to backend source enum
        const backendSource = customerType === 'REFERRAL' ? 'REFERRAL_PARTNER' : 'INTERNAL';
        updateData.source = backendSource;

        if (customerType === 'REFERRAL' && selectedReferralPartner) {
          updateData.referralPartnerId = selectedReferralPartner;
        }
      } else if (customerStatus === 'POTENTIAL') {
        updateData.customerId = '';

        // Map frontend type to backend source enum
        const backendSource = customerType === 'REFERRAL' ? 'REFERRAL_PARTNER' : 'INTERNAL';
        updateData.source = backendSource;

        if (leadInfo.leadName) updateData.leadName = leadInfo.leadName;
        if (leadInfo.leadPhone) updateData.leadPhone = leadInfo.leadPhone;
        if (leadInfo.leadEmail) updateData.leadEmail = leadInfo.leadEmail;
        if (leadInfo.leadTaxId) updateData.leadTaxId = leadInfo.leadTaxId;
        if (leadInfo.leadAddress) updateData.leadAddress = leadInfo.leadAddress;

        if (customerType === 'REFERRAL' && selectedReferralPartner) {
          updateData.referralPartnerId = selectedReferralPartner;
        }
      }

      await updateOpportunity({ id, ...updateData }).unwrap();
      setShowContactModal(false);
    } catch (err) {
      alert(err?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const handleApproveOpportunity = async () => {
    try {
      await approveOpportunity(id).unwrap();
      toast.success('Duyệt cơ hội thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi duyệt cơ hội');
    }
  };

  const handleQuotationSubmit = async (quotationData, quotationId) => {
    try {
      if (quotationId) {
        // Update existing quotation
        await updateQuotation({
          id: quotationId,
          opportunityId: id,
          ...quotationData
        }).unwrap();
        toast.success('Cập nhật báo giá thành công');
      } else {
        // Create new quotation with full details in one call
        await createQuotation({
          opportunityId: id,
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

  const handleCreateQuotation = () => {
    if (incompleteAiJobs.length > 0) {
      const jobNames = [...new Set(incompleteAiJobs.map(job => job.name))].join(', ');
      toast.warning(`Vui lòng điền đầy đủ giá vốn job AI trước khi tạo báo giá: ${jobNames}`);
      return;
    }

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
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${OPPORTUNITY_STATUS_COLORS[opportunity.status]}`}>
                {OPPORTUNITY_STATUS_LABELS[opportunity.status] || opportunity.status}
              </span>
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${PRIORITY_COLORS[opportunity.priority]}`}>
                {PRIORITY_LABELS[opportunity.priority] || opportunity.priority}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{opportunity.name}</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDuplicateModal(true)}
              disabled={opportunity.status === 'QUOTATION_DRAFTING'}
              title={opportunity.status === 'QUOTATION_DRAFTING' ? 'Không thể sao chép khi cơ hội đang làm báo giá' : undefined}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <Copy className="w-4 h-4" />
              Sao chép cơ hội
            </button>
            {(opportunity.customer || opportunity.leadName) && (
              <>
                {opportunity.quotations.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowQuotationsListModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Xem báo giá
                    </button>
                    {showBadge && (
                      <span className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 text-[10px] font-black text-white bg-red-500 rounded-full ring-2 ring-white shadow-sm">
                        {draftCount > 9 ? '9+' : draftCount}
                      </span>
                    )}
                  </div>
                )}
                {(opportunity.status === 'QUOTATION_DRAFTING' || opportunity.status === 'PENDING_QUOTE_APPROVAL' || opportunity.status === 'OPP_APPROVED' && (currentUser.role == 'ADMIN' || currentUser.id == opportunity.createdBy.id)) && (
                  <button
                    onClick={handleCreateQuotation}
                    aria-disabled={incompleteAiJobs.length > 0}
                    title={incompleteAiJobs.length > 0 ? 'Cần điền đầy đủ giá vốn job AI trước' : undefined}
                    className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg transition-colors ${incompleteAiJobs.length > 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-green-700'}`}
                  >
                    Tạo báo giá
                  </button>
                )}
                {opportunity.status === 'PENDING_OPP_APPROVAL' && (opportunity.customer || opportunity.leadName) &&
                  (currentUser.role == 'ADMIN' || currentUser.role == 'BOD') && (
                    <button
                      onClick={handleApproveOpportunity}
                      disabled={isApproving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isApproving ? 'Đang duyệt...' : 'Duyệt cơ hội'}
                    </button>
                  )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="pt-2 px-6">
              <p
                type="button"
                className="inline-flex items-center justify-center gap-2 px-1 py-2 text-sm font-semibold text-blue-700"
              >
                <FileText className="w-4 h-4" />
                Mô tả
              </p>
            </div>
            <div className="px-6 pb-3">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {opportunity.description || 'Chưa có mô tả'}
              </p>
            </div>
          </div>
          <FinancialInfo opportunity={opportunity} formatDate={formatDate} />
          <TimeLocationInfo opportunity={opportunity} formatDate={formatDate} />
          <OpportunityEvaluation opportunity={opportunity} />
          <OpportunityServicesInfo opportunity={opportunity} onAddCustomer={handleOpenContactModal} />
          <AttachmentsList attachments={opportunity.attachments} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6 ">
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
        isSubmitting={isUpdatingQuotation || isCreatingQuotation}
        currentUser={currentUser}
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
        customers={displayCustomers}
        onSave={handleSaveContact}
        isUpdating={isUpdating || isLoadingPartnerDetails}
      />

      <OpportunityModal
        isOpen={showDuplicateModal}
        initialData={showDuplicateModal ? opportunity : null}
        onClose={() => setShowDuplicateModal(false)}
        onSuccess={() => setShowDuplicateModal(false)}
      />

      <QuotationsListModal
        isOpen={showQuotationsListModal}
        onClose={() => setShowQuotationsListModal(false)}
        quotations={quotations}
        isLoading={isLoadingQuotations}
        onCreateNew={handleCreateQuotation}
        onEditQuotation={handleEditQuotation}
        onApprovedContract={(contractId) => {
          setShowQuotationsListModal(false);
          navigate(`/contracts/${contractId}`);
        }}
        opportunity={opportunity}
        formatDate={formatDate}
        currentUser={currentUser}
      />
    </div>
  );
};

export default OpportunityDetailPage;
