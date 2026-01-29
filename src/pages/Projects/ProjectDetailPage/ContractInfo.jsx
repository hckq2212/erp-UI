import { FileText, DollarSign, ExternalLink } from 'lucide-react';
import { formatNumber } from '../../../utils/format';

export const ContractInfo = ({ contract }) => {
    if (!contract) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Thông tin hợp đồng</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Mã hợp đồng</p>
                    <p className="text-sm font-medium text-gray-900">{contract.contractCode}</p>
                </div>

                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Hồ sơ tài liệu</p>
                    <div className="space-y-2">
                        {contract.proposal_contract && (
                            <a
                                href={contract.proposal_contract}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition-colors"
                            >
                                <span className="truncate">Proposal Contract</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                        )}
                        {contract.signed_contract && (
                            <a
                                href={contract.signed_contract}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100 transition-colors"
                            >
                                <span className="truncate">Signed Contract</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                        )}
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Giá trị thương mại</p>
                    <p className="text-lg font-bold text-green-600">{formatNumber(contract.sellingPrice)} VNĐ</p>
                </div>
            </div>
        </div>
    );
};
