import { useState } from 'react';
import { FileText, X, Plus, ExternalLink, Clock } from 'lucide-react';
import { formatNumber } from '../../../utils/format';
import { QuotationDetailModal } from './QuotationDetailModal';
import { useCreateQuotationMutation } from '../../../api/quotations';

export const QuotationsListModal = ({
  isOpen,
  onClose,
  quotations,
  isLoading,
  onCreateNew,
  onEditQuotation,
  opportunity,
  formatDate,
  currentUser
}) => {
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Danh sách báo giá</h3>
            <span className="text-sm text-gray-500">({quotations.length} báo giá)</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Chưa có báo giá nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => setSelectedQuotationId(quotation.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${quotation.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                          quotation.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                            quotation.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              quotation.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                          }`}>
                          {quotation.status === 'DRAFT' ? 'Nháp' :
                            quotation.status === 'SENT' ? 'Đã gửi' :
                              quotation.status === 'APPROVED' ? 'Đã duyệt' :
                                quotation.status === 'REJECTED' ? 'Từ chối' :
                                  quotation.status}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900"> Báo giá lần {quotation.version} </h4>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Tổng giá trị</p>
                      <p className="font-semibold text-gray-900">
                        {formatNumber(quotation.totalAmount || 0)} VNĐ
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Ngày tạo</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(quotation.createdAt)}
                      </p>
                    </div>
                  </div>

                  {quotation.validUntil && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Hiệu lực đến: {formatDate(quotation.validUntil)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      <QuotationDetailModal
        quotationId={selectedQuotationId}
        isOpen={!!selectedQuotationId}
        onClose={() => setSelectedQuotationId(null)}
        onEdit={(quotation) => {
          setSelectedQuotationId(null);
          onEditQuotation(quotation);
        }}
        opportunity={opportunity}
        formatDate={formatDate}
        currentUser={currentUser}
      />
    </div>
  );
};
