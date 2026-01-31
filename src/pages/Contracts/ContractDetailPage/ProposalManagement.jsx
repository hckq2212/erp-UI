import { FileText, Upload, CheckCircle, FileCheck, Loader2 } from 'lucide-react';

export const ProposalManagement = ({
  contract,
  onUploadProposal,
  onApproveProposal,
  onUploadSigned,
  isUploadingProposal,
  isUploadingSigned
}) => (
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
                {contract.status === 'PROPOSAL_UPLOADED' && (
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
                disabled={isUploadingProposal}
                className={`flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm ${isUploadingProposal ? 'opacity-50 cursor-not-allowed' : ''
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
                disabled={isUploadingSigned}
                className={`flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm ${isUploadingSigned ? 'opacity-50 cursor-not-allowed' : ''
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
      </div>
    </div>
  </div>
);
