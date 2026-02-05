import { FileText, ExternalLink, LayoutList } from 'lucide-react';
import { formatNumber } from '../../../utils/format';

export const ContractInfo = ({ contract }) => {
    if (!contract) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-6">
                {/* Services Table */}
                <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                        <LayoutList className="w-4 h-4 text-emerald-600" />
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Hạng mục dịch vụ</p>
                    </div>
                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-3">Dịch vụ</th>
                                    <th className="px-4 py-3 text-center">Trạng thái</th>
                                    <th className="px-4 py-3 text-right">Kết quả</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contract.services?.length > 0 ? (
                                    contract.services.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-700">
                                                {item.service?.name || item.name || `Hạng mục #${item.id}`}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'ACTIVE'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                    : 'bg-gray-50 text-gray-600 border border-gray-100'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500 italic">
                                                {item.result && (
                                                    <a
                                                        href={item.result?.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#f5530d] border-[#f5530d] font-bold border-2 bg-[#fff7ed] px-2 py-1 rounded-md">
                                                        {item.result?.name}
                                                    </a>
                                                )}
                                                {item.result === null && (
                                                    <span className="text-gray-400 italic">Chưa có kết quả</span>
                                                )}

                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-gray-400 italic">
                                            Chưa có hạng mục dịch vụ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

