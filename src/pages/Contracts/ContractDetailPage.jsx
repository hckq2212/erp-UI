import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  FileText,
  Trash2,
  Plus,
  Edit,
  User,
  DollarSign,
  Calendar,
  Building2,
  FileCheck,
  Clock,
} from 'lucide-react';
import {
  useGetContractQuery,
  useUploadProposalMutation,
  useApproveProposalMutation,
  useUploadSignedMutation,
  useAddMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useUpdateContractMutation,
} from '../../api/contracts';
import { toast } from 'react-toastify';

const STATUS_LABELS = {
  DRAFT: 'Bản nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  ACTIVE: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy'
};

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

// Contract Info Component
const ContractInfo = ({ contract, formatDate }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <FileCheck className="w-5 h-5 text-blue-600" />
      Thông tin hợp đồng
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-gray-500">Mã hợp đồng</label>
        <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded mt-1">
          {contract.contractCode || contract.contract_code || '—'}
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
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[contract.status] || 'bg-gray-100 text-gray-800'}`}>
            {STATUS_LABELS[contract.status] || contract.status}
          </span>
        </p>
      </div>
    </div>
  </div>
);

// Customer Info Component
const CustomerInfo = ({ contract }) => (
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

// Financial Info Component
const FinancialInfo = ({ contract }) => (
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

// Proposal Management Component
const ProposalManagement = ({ contract, onUploadProposal, onApproveProposal, onUploadSigned }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <FileText className="w-5 h-5 text-purple-600" />
      Quản lý đề xuất & hợp đồng
    </h2>
    <div className="space-y-3">
      {/* Proposal */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Hợp đồng proposal</h3>
            <p className="text-sm text-gray-500 mt-1">
              {contract.proposal_contract ? 'Đã upload' : 'Chưa có file'}
            </p>
          </div>
          <div className="flex gap-2">
            {contract.proposal_contract ? (
              <>
                <a
                  href={contract.proposal_contract}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Xem
                </a>
                {contract.status !== 'APPROVED' && (
                  <button
                    onClick={onApproveProposal}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Duyệt
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onUploadProposal}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Signed Contract */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Hợp đồng đã ký</h3>
            <p className="text-sm text-gray-500 mt-1">
              {contract.signed_contract ? 'Đã upload' : 'Chưa có file'}
            </p>
          </div>
          <div>
            {contract.signed_contract ? (
              <a
                href={contract.signed_contract}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <FileCheck className="w-4 h-4" />
                Xem
              </a>
            ) : (
              <button
                onClick={onUploadSigned}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Milestones Component
const MilestonesSection = ({ contract, onAddMilestone, onEditMilestone, onDeleteMilestone, formatDate }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Clock className="w-5 h-5 text-orange-600" />
        Mốc thanh toán
      </h2>
      <button
        onClick={onAddMilestone}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Thêm mốc
      </button>
    </div>

    {contract.milestones && contract.milestones.length > 0 ? (
      <div className="space-y-3">
        {contract.milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Hạn: {formatDate(milestone.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-green-600">
                      {Number(milestone.amount || 0).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onEditMilestone(milestone)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteMilestone(milestone)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Chưa có mốc thanh toán nào</p>
        <p className="text-sm mt-1">Nhấn "Thêm mốc" để tạo mới</p>
      </div>
    )}
  </div>
);


// Main Component
export const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contract, isLoading, error } = useGetContractQuery(id);

  const [uploadProposal] = useUploadProposalMutation();
  const [approveProposal] = useApproveProposalMutation();
  const [uploadSigned] = useUploadSignedMutation();
  const [addMilestone] = useAddMilestoneMutation();
  const [updateMilestone] = useUpdateMilestoneMutation();
  const [deleteMilestone] = useDeleteMilestoneMutation();

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleUploadProposal = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      console.log('Uploading proposal file:', file);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });
      
      try {
        const result = await uploadProposal({ id: contract.id, file }).unwrap();
        console.log('Upload result:', result);
        toast.success('Upload proposal thành công');
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(err?.data?.message || 'Upload thất bại');
      }
    };
    input.click();
  };

  const handleApproveProposal = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn duyệt proposal này?')) return;
    try {
      await approveProposal(contract.id).unwrap();
      toast.success('Duyệt proposal thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Duyệt thất bại');
    }
  };

  const handleUploadSigned = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      console.log('Uploading signed contract file:', file);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });
      
      try {
        const result = await uploadSigned({ id: contract.id, file }).unwrap();
        console.log('Upload result:', result);
        toast.success('Upload hợp đồng đã ký thành công');
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(err?.data?.message || 'Upload thất bại');
      }
    };
    input.click();
  };

  const handleAddMilestone = async () => {
    const title = window.prompt('Tiêu đề mốc thanh toán:');
    if (!title) return;
    const dueDate = window.prompt('Ngày đến hạn (YYYY-MM-DD):');
    const amountStr = window.prompt('Số tiền (VNĐ):');
    const amount = amountStr ? Number(amountStr.replace(/[^0-9.-]+/g, '')) : 0;
    try {
      await addMilestone({ id: contract.id, title, dueDate, amount }).unwrap();
      toast.success('Thêm mốc thanh toán thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Thêm thất bại');
    }
  };

  const handleEditMilestone = async (milestone) => {
    const title = window.prompt('Tiêu đề mốc thanh toán:', milestone.title) || milestone.title;
    const dueDate = window.prompt('Ngày đến hạn (YYYY-MM-DD):', milestone.dueDate) || milestone.dueDate;
    const amountStr = window.prompt('Số tiền (VNĐ):', milestone.amount) || String(milestone.amount || '0');
    const amount = Number(amountStr.replace(/[^0-9.-]+/g, ''));
    try {
      await updateMilestone({ id: milestone.id, title, dueDate, amount }).unwrap();
      toast.success('Cập nhật mốc thanh toán thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleDeleteMilestone = async (milestone) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mốc "${milestone.title}"?`)) return;
    try {
      await deleteMilestone(milestone.id).unwrap();
      toast.success('Xóa mốc thanh toán thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Xóa thất bại');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 mb-4">Không tìm thấy hợp đồng</p>
        <button
          onClick={() => navigate('/contracts')}
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
          onClick={() => navigate('/contracts')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại danh sách hợp đồng</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {contract.contractCode || contract.contract_code || '—'}
              </span>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[contract.status] || 'bg-gray-100 text-gray-800'}`}>
                {STATUS_LABELS[contract.status] || contract.status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{contract.name}</h1>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <ContractInfo contract={contract} formatDate={formatDate} />
          <ProposalManagement
            contract={contract}
            onUploadProposal={handleUploadProposal}
            onApproveProposal={handleApproveProposal}
            onUploadSigned={handleUploadSigned}
          />
          <MilestonesSection
            contract={contract}
            onAddMilestone={handleAddMilestone}
            onEditMilestone={handleEditMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            formatDate={formatDate}
          />
        </div>

        {/* Sidebar - Right Side (1/3) */}
        <div className="space-y-6">
          <CustomerInfo contract={contract} />
          <FinancialInfo contract={contract} />
        </div>
      </div>
    </div>
  );
};

export default ContractDetailPage;
