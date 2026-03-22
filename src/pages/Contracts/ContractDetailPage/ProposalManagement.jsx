import { useState } from 'react';
import { FileText, Upload, CheckCircle, FileCheck, Loader2, X, Send } from 'lucide-react';
import { getFilePreviewUrl } from '../../../utils/cloudinary';

export const ProposalManagement = ({
  contract,
  onUploadProposal,
  onApproveProposal,
  onRejectProposal,
  onUploadSigned,
  isUploadingProposal,
  isUploadingSigned,
  isApprovingProposal,
  isRejectingProposal,
  uploadProgress = 0,
  currentUser
}) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) return;
    onRejectProposal(rejectionReason);
    setIsRejecting(false);
    setRejectionReason('');
  };

  const ProgressBar = ({ progress }) => (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider tabular-nums">Đang tải lên...</span>
        <span className="text-[10px] font-bold text-blue-600">{progress}%</span>
      </div>
      <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden border border-blue-100 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-purple-600" />
        Quản lý hợp đồng
      </h2>
      <div className="space-y-3">
        {/* Proposal */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Hợp đồng <span className="text-sm italic text-gray-400">(.docx)</span></h3>
              <p className="text-sm text-gray-500 mt-1">
                {contract.proposal_contract ? 'Đã upload' : 'Chưa có file'}
              </p>
            </div>
            <div className="flex gap-2">
              {contract.proposal_contract ? (
                <>
                  {!isRejecting && (
                    <a
                      href={getFilePreviewUrl(contract.proposal_contract)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Xem
                    </a>
                  )}
                  {contract.status === 'PROPOSAL_UPLOADED' && !isRejecting && (currentUser.role === 'ADMIN' || currentUser.role === 'BOD') && (
                    <div className="flex gap-2">
                      <button
                        onClick={onApproveProposal}
                        disabled={isUploadingProposal || isUploadingSigned || isApprovingProposal || isRejectingProposal}
                        className={`flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium ${(isUploadingProposal || isUploadingSigned || isApprovingProposal || isRejectingProposal) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isApprovingProposal ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {isApprovingProposal ? 'Đang duyệt...' : 'Duyệt'}
                      </button>
                      <button
                        onClick={() => setIsRejecting(true)}
                        disabled={isUploadingProposal || isUploadingSigned || isApprovingProposal || isRejectingProposal}
                        className={`flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium ${(isUploadingProposal || isUploadingSigned || isApprovingProposal || isRejectingProposal) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <X className="w-4 h-4" />
                        Từ chối
                      </button>
                    </div>
                  )}
                  {contract.status === 'PROPOSAL_REJECTED' && !isRejecting && (
                    <button
                      onClick={onUploadProposal}
                      disabled={isUploadingProposal || isUploadingSigned}
                      className={`flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium ${(isUploadingProposal || isUploadingSigned) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                      {isUploadingProposal ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {isUploadingProposal ? 'Đang upload...' : 'Upload bản mới'}
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={onUploadProposal}
                  disabled={isUploadingProposal || isUploadingSigned}
                  className={`flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium ${(isUploadingProposal || isUploadingSigned) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {isUploadingProposal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploadingProposal ? 'Đang upload...' : 'Upload'}
                </button>
              )}
            </div>
          </div>

          {/* Rejection UI Expansion */}
          {isRejecting && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nhập lý do từ chối:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ví dụ: Nội dung hợp đồng cần điều chỉnh phần thanh toán..."
                className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px] transition-all"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setIsRejecting(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={!rejectionReason.trim() || isUploadingProposal || isUploadingSigned || isApprovingProposal || isRejectingProposal}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold shadow-sm"
                >
                  {isRejectingProposal ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {isRejectingProposal ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          )}

          {contract.status === 'PROPOSAL_REJECTED' && contract.rejectionReason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Lý do từ chối hiện tại:</p>
              <p className="text-sm text-red-700">{contract.rejectionReason}</p>
            </div>
          )}
          {isUploadingProposal && <ProgressBar progress={uploadProgress} />}
        </div>

        {/* Signed Contract */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Hợp đồng đã ký <span className="text-sm italic text-gray-400">(.pdf)</span></h3>
              <p className="text-sm text-gray-500 mt-1">
                {contract.signed_contract ? 'Đã upload' : 'Chưa có file'}
              </p>
            </div>
            <div>
              {contract.signed_contract ? (
                <a
                  href={getFilePreviewUrl(contract.signed_contract)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <FileCheck className="w-4 h-4" />
                  Xem
                </a>
              ) : (
                <button
                  onClick={onUploadSigned}
                  disabled={isUploadingSigned || isUploadingProposal}
                  className={`flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium ${(isUploadingSigned || isUploadingProposal) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {isUploadingSigned ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploadingSigned ? 'Đang upload...' : 'Upload'}
                </button>
              )}
            </div>
          </div>
          {isUploadingSigned && <ProgressBar progress={uploadProgress} />}
        </div>
      </div>
    </div>
  );
};
