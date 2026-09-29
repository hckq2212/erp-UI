import { useEffect, useState } from 'react';
import { FileText, Upload, CheckCircle, Loader2, X, Send, Link2, FileSpreadsheet } from 'lucide-react';
import { DocumentCard, DocumentPreviewModal } from '../../../components/common';
import { toast } from 'react-toastify';

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
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('');
  const [proposalFile, setProposalFile] = useState(null);
  const [contractLink, setContractLink] = useState('');
  const [quotationMethod, setQuotationMethod] = useState('');
  const [quotationFile, setQuotationFile] = useState(null);
  const [quotationLink, setQuotationLink] = useState('');
  const [previewModalFile, setPreviewModalFile] = useState(null);
  const [signedFile, setSignedFile] = useState(null);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState('');
  const [isConfirmingSignedUpload, setIsConfirmingSignedUpload] = useState(false);
  const [isSignedSubmitLocked, setIsSignedSubmitLocked] = useState(false);

  useEffect(() => {
    if (!signedFile) {
      setSignedPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(signedFile);
    setSignedPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [signedFile]);

  const openProposalEditor = () => {
    setUploadMethod('');
    setProposalFile(null);
    setContractLink('');
    setQuotationMethod(contract.quotation_link ? 'LINK' : '');
    setQuotationFile(null);
    setQuotationLink(contract.quotation_link || '');
    setIsEditingProposal(true);
  };

  const changeUploadMethod = (method) => {
    setUploadMethod(method);
    setProposalFile(null);
    setContractLink('');
  };

  const changeQuotationMethod = (method) => {
    setQuotationMethod(method);
    setQuotationFile(null);
    setQuotationLink(method === 'LINK' ? contract.quotation_link || '' : '');
  };

  const handleSubmitProposal = async (event) => {
    event.preventDefault();
    const succeeded = await onUploadProposal({
      file: uploadMethod === 'FILE' ? proposalFile : undefined,
      contractLink: uploadMethod === 'LINK' ? contractLink : undefined,
      quotationLink: quotationMethod === 'LINK' ? quotationLink : undefined,
      quotationFile: quotationMethod === 'FILE' ? quotationFile : undefined,
    });
    if (succeeded) setIsEditingProposal(false);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) return;
    onRejectProposal(rejectionReason);
    setIsRejecting(false);
    setRejectionReason('');
  };

  const handleSignedFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setSignedFile(null);
      toast.error('Chỉ chấp nhận file .pdf cho hợp đồng đã ký');
      return;
    }

    setSignedFile(file);
  };

  const handleSendSigned = async () => {
    if (isSignedSubmitLocked || isUploadingSigned) return;

    setIsSignedSubmitLocked(true);
    try {
      const succeeded = await onUploadSigned(signedFile);
      if (succeeded) {
        setSignedFile(null);
        setIsConfirmingSignedUpload(false);
      }
    } finally {
      setIsSignedSubmitLocked(false);
    }
  };

  const formatFileSize = (size = 0) => {
    if (!size) return '';
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
              <h3 className="font-medium text-gray-900">Hợp đồng <span className="text-sm italic text-gray-400">(.docx, .pdf hoặc link)</span></h3>
              <p className="text-sm text-gray-500 mt-1">
                {contract.proposal_contract ? 'Đã upload' : 'Chưa có file'}
              </p>
            </div>
            <div className="flex gap-2">
              {contract.proposal_contract ? (
                <>
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
                      onClick={openProposalEditor}
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
                  onClick={openProposalEditor}
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

          {/* Thẻ xem trước Hợp đồng dự thảo */}
          {contract.proposal_contract && !isEditingProposal && (
            <div className="mt-3.5 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tệp hợp đồng đính kèm:</p>
              <DocumentCard
                url={contract.proposal_contract}
                fileName={`Hợp đồng dự thảo - ${contract.contractCode || contract.name || 'Proposal'}`}
                onPreview={(file) => setPreviewModalFile(file)}
              />
            </div>
          )}

          {/* Thẻ xem trước Link báo giá */}
          {contract.quotation_link && !isEditingProposal && (
            <div className="mt-3.5 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Báo giá liên kết:</p>
              <DocumentCard
                url={contract.quotation_link}
                fileName={`Báo giá liên kết - ${contract.contractCode || contract.name || 'Quotation'}`}
                onPreview={(file) => setPreviewModalFile(file)}
              />
            </div>
          )}

          {isEditingProposal && (
            <form onSubmit={handleSubmitProposal} className="mt-4 space-y-4 border-t border-gray-100 pt-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Chọn hình thức upload hợp đồng</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${uploadMethod === 'FILE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="proposalUploadMethod"
                      value="FILE"
                      checked={uploadMethod === 'FILE'}
                      onChange={() => changeUploadMethod('FILE')}
                    />
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Tải file Word/PDF</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${uploadMethod === 'LINK' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="proposalUploadMethod"
                      value="LINK"
                      checked={uploadMethod === 'LINK'}
                      onChange={() => changeUploadMethod('LINK')}
                    />
                    <Link2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Nhập link hợp đồng</span>
                  </label>
                </div>
              </div>

              {uploadMethod === 'FILE' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">File hợp đồng (.docx, .pdf)</label>
                  <input
                    type="file"
                    accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                    onChange={(event) => setProposalFile(event.target.files?.[0] || null)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              )}

              {uploadMethod === 'LINK' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Link hợp đồng</label>
                  <input
                    type="url"
                    required
                    value={contractLink}
                    onChange={(event) => setContractLink(event.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Báo giá (nếu có)</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${quotationMethod === 'LINK' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="quotationUploadMethod"
                      value="LINK"
                      checked={quotationMethod === 'LINK'}
                      onChange={() => changeQuotationMethod('LINK')}
                    />
                    <Link2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Nhập link báo giá</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${quotationMethod === 'FILE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="quotationUploadMethod"
                      value="FILE"
                      checked={quotationMethod === 'FILE'}
                      onChange={() => changeQuotationMethod('FILE')}
                    />
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Tải file Excel</span>
                  </label>
                </div>

                {quotationMethod === 'LINK' && (
                  <input
                    type="url"
                    value={quotationLink}
                    onChange={(event) => setQuotationLink(event.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                )}

                {quotationMethod === 'FILE' && (
                  <input
                    type="file"
                    accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(event) => setQuotationFile(event.target.files?.[0] || null)}
                    className="mt-3 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProposal(false)}
                  disabled={isUploadingProposal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploadingProposal || !uploadMethod || (uploadMethod === 'FILE' ? !proposalFile : !contractLink.trim())}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploadingProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploadingProposal ? 'Đang cập nhật...' : 'Lưu'}
                </button>
              </div>
            </form>
          )}

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
                <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                  Đã gửi
                </span>
              ) : (
                <label className={`flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium ${(isUploadingSigned || isUploadingProposal) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}>
                  <Upload className="w-4 h-4" />
                  Chọn file
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleSignedFileChange}
                    disabled={isUploadingSigned || isUploadingProposal}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {signedFile && !contract.signed_contract && (
            <div className="mt-3.5 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">File đã chọn, kiểm tra trước khi gửi:</p>
              <DocumentCard
                url={signedPreviewUrl}
                fileName={signedFile.name}
                fileSize={formatFileSize(signedFile.size)}
                onPreview={(file) => setPreviewModalFile(file)}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSignedFile(null)}
                  disabled={isUploadingSigned || isSignedSubmitLocked}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingSignedUpload(true)}
                  disabled={isUploadingSigned || isUploadingProposal || isSignedSubmitLocked}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {(isUploadingSigned || isSignedSubmitLocked) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {(isUploadingSigned || isSignedSubmitLocked) ? 'Đang gửi...' : 'Gửi đi'}
                </button>
              </div>
            </div>
          )}

          {/* Thẻ xem trước Hợp đồng đã ký */}
          {contract.signed_contract && (
            <div className="mt-3.5 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tệp hợp đồng đã ký:</p>
              <DocumentCard
                url={contract.signed_contract}
                fileName={`Hợp đồng đã ký - ${contract.contractCode || contract.name || 'Signed'}.pdf`}
                onPreview={(file) => setPreviewModalFile(file)}
              />
            </div>
          )}

          {isUploadingSigned && <ProgressBar progress={uploadProgress} />}
        </div>
      </div>

      {/* Modal xem trước tài liệu đa năng */}
      <DocumentPreviewModal
        isOpen={Boolean(previewModalFile)}
        onClose={() => setPreviewModalFile(null)}
        url={previewModalFile?.url}
        fileName={previewModalFile?.fileName}
      />

      {isConfirmingSignedUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-100 p-5">
              <h3 className="text-lg font-bold text-gray-900">Xác nhận gửi hợp đồng đã ký</h3>
              <p className="mt-1 text-sm text-gray-500">Sau khi gửi, hệ thống sẽ upload file và không cho upload lại bản khác.</p>
            </div>
            <div className="p-5">
              <DocumentCard
                url={signedPreviewUrl}
                fileName={signedFile?.name || 'Hợp đồng đã ký.pdf'}
                fileSize={formatFileSize(signedFile?.size)}
                onPreview={(file) => setPreviewModalFile(file)}
              />
              {(isUploadingSigned || isSignedSubmitLocked) && <ProgressBar progress={uploadProgress} />}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
              <button
                type="button"
                onClick={() => setIsConfirmingSignedUpload(false)}
                disabled={isUploadingSigned || isSignedSubmitLocked}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSendSigned}
                disabled={isUploadingSigned || isSignedSubmitLocked || !signedFile}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {(isUploadingSigned || isSignedSubmitLocked) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {(isUploadingSigned || isSignedSubmitLocked) ? 'Đang gửi...' : 'Xác nhận gửi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
