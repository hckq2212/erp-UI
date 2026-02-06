import { useState } from 'react';
import { FileText, ExternalLink, LayoutList, Send } from 'lucide-react';
import { formatNumber } from '../../../utils/format';
import { useGetMeQuery } from '../../../api/auth';
import { CreateAcceptanceModal } from './CreateAcceptanceModal';
import { CONTRACT_SERVICE_STATUS_LABELS, CONTRACT_SERVICE_STATUS_COLORS } from '../../../utils/enums';

export const ContractInfo = ({ contract, projectId }) => {
    const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
    const { data: me } = useGetMeQuery();

    if (!contract) return null;

    const isTeamLeadOrAdmin = me?.role === 'ADMIN' || me?.role === 'TEAM_LEAD';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-6">
                {/* Services Table */}
                <div className="">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <LayoutList className="w-4 h-4 text-emerald-600" />
                            <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Hạng mục dịch vụ</p>
                        </div>
                        {isTeamLeadOrAdmin && (
                            <button
                                onClick={() => setIsAcceptanceModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                            >
                                <Send className="w-3.5 h-3.5" />
                                Gửi nghiệm thu
                            </button>
                        )}
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
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${CONTRACT_SERVICE_STATUS_COLORS[item.status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                                    {CONTRACT_SERVICE_STATUS_LABELS[item.status] || item.status}
                                                </span>
                                                {item.status === 'ACCEPTANCE_REJECTED' && item.feedback && (
                                                    <div className="mt-1 text-[9px] text-red-500 italic max-w-[150px] mx-auto text-center leading-tight">
                                                        Lý do: {item.feedback}
                                                    </div>
                                                )}
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

            <CreateAcceptanceModal
                isOpen={isAcceptanceModalOpen}
                onClose={() => setIsAcceptanceModalOpen(false)}
                contract={contract}
                projectId={projectId}
            />
        </div>
    );
};

