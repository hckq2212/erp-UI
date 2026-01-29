import { FileText, Upload, CheckCircle, FileCheck } from 'lucide-react';

export const ProposalManagement = ({ contract, onUploadProposal, onApproveProposal, onUploadSigned }) => (
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
