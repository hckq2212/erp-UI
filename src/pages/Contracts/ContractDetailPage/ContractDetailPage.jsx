import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useGetContractQuery,
  useUploadProposalMutation,
  useApproveProposalMutation,
  useUploadSignedMutation,
  useAddMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
} from '../../../api/contracts';
import { useGetProjectsByContractQuery } from '../../../api/projects';
import { toast } from 'react-toastify';
import { ContractInfo } from './ContractInfo';
import { CustomerInfo } from './CustomerInfo';
import { FinancialInfo } from './FinancialInfo';
import { ProposalManagement } from './ProposalManagement';
import { ProjectInfo } from './ProjectInfo';
import { MilestonesSection } from './MilestonesSection';
import { AssessExtraTasks } from './AssessExtraTasks';
import { ContractAddendums } from './ContractAddendums';
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '../../../utils/enums';
import { cn } from '../../../utils/cn';

export const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contract, isLoading, error } = useGetContractQuery(id);
  const { data: project, isLoading: projectLoading } = useGetProjectsByContractQuery(id, {
    skip: !id,
  });
  const [activeTab, setActiveTab] = useState('MAIN'); // 'MAIN' | 'EXTRA'

  const [uploadProposal, { isLoading: isUploadingProposal }] = useUploadProposalMutation();
  const [approveProposal] = useApproveProposalMutation();
  const [uploadSigned, { isLoading: isUploadingSigned }] = useUploadSignedMutation();
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

      // console.log('Uploading proposal file:', file);
      // console.log('File details:', { name: file.name, size: file.size, type: file.type });

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

  const extraTasks = project?.tasks?.filter(t => t.status === 'AWAITING_PRICING') || [];
  const hasExtraTasks = extraTasks.length > 0;

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
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${CONTRACT_STATUS_COLORS[contract.status] || 'bg-gray-100 text-gray-800'}`}>
                {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{contract.name}</h1>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      {hasExtraTasks && (
        <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200 shadow-sm mb-6 w-fit">
          <button
            onClick={() => setActiveTab('MAIN')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'MAIN' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            )}
          >
            Thông tin chung
          </button>
          <button
            onClick={() => setActiveTab('EXTRA')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'EXTRA' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            )}
          >
            Công việc phát sinh
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
              {extraTasks.length}
            </span>
          </button>
        </div>
      )}

      {/* Content Grid */}
      {activeTab === 'MAIN' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <ContractInfo contract={contract} formatDate={formatDate} />
            {project &&
              <ProjectInfo project={project} formatDate={formatDate} navigate={navigate} contractId={contract.id}
              />}
            <ProposalManagement
              contract={contract}
              onUploadProposal={handleUploadProposal}
              onApproveProposal={handleApproveProposal}
              onUploadSigned={handleUploadSigned}
              isUploadingProposal={isUploadingProposal}
              isUploadingSigned={isUploadingSigned}
            />
            <FinancialInfo contract={contract} />
            <ContractAddendums addendums={contract.addendums} />
          </div>

          {/* Sidebar - Right Side (1/3) */}
          <div className="space-y-6">
            <CustomerInfo contract={contract} />
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Định giá công việc phát sinh</h2>
            <p className="text-gray-500 text-sm">Xác nhận đơn giá hoặc chuyển thành công việc ghi nhận chi phí cho các hạng mục phát sinh ngoài hợp đồng</p>
          </div>
          <AssessExtraTasks tasks={extraTasks} opportunityId={contract?.opportunity?.id} />
        </div>
      )}
    </div>
  );
};

export default ContractDetailPage;
