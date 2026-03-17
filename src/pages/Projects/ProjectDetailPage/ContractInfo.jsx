import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, LayoutList, Send } from 'lucide-react';
import { formatNumber } from '../../../utils/format';
import { useGetMeQuery } from '../../../api/auth';
import { CreateAcceptanceModal } from './CreateAcceptanceModal';
import { CONTRACT_SERVICE_STATUS_LABELS, CONTRACT_SERVICE_STATUS_COLORS } from '../../../utils/enums';
import { getFilePreviewUrl } from '../../../utils/cloudinary';

export const ContractInfo = ({ contract, projectId }) => {
    const navigate = useNavigate();
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
                        {/* {isTeamLeadOrAdmin && ( */}
                        <button
                            onClick={() => setIsAcceptanceModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Gửi nghiệm thu
                        </button>
                        {/* )} */}
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
                                {(() => {
                                    if (!contract.services || contract.services.length === 0) return null;

                                    // Group services
                                    const grouped = contract.services.reduce((acc, item) => {
                                        const groupKey = item.packageName || 'Lẻ';
                                        if (!acc[groupKey]) acc[groupKey] = [];
                                        acc[groupKey].push(item);
                                        return acc;
                                    }, {});

                                    return Object.entries(grouped).map(([groupName, items]) => (
                                        <React.Fragment key={groupName}>
                                            {groupName !== 'Lẻ' && (
                                                <tr className="bg-gray-50/80 border-l-4 border-l-blue-500">
                                                    <td colSpan="3" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                        Gói: {groupName}
                                                    </td>
                                                </tr>
                                            )}
                                            {items.map((item) => (
                                                <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${item.isPackageService ? 'bg-blue-50/10' : ''}`}>
                                                    <td className={`px-4 py-3 ${item.isPackageService ? 'pl-8' : ''}`}>
                                                        <div className="font-semibold text-gray-700">
                                                            {item.name || item.service?.name || `Hạng mục #${item.id}`}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Công việc đầu ra:</p>
                                                        {item.tasks?.filter(t => t.isOutput).map(task => (
                                                            <button
                                                                key={task.id}
                                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                                                className="text-[10px] text-purple-600 font-bold hover:text-purple-800 transition-colors flex items-center gap-1 mt-0.5"
                                                            >
                                                                {task.code}
                                                                <ExternalLink className="w-2.5 h-2.5" />
                                                            </button>
                                                        ))}
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
                                                        {item.results && item.results.length > 0 ? (
                                                            <div className="flex flex-col gap-2 items-end">
                                                                {item.results.map((res, index) => (
                                                                    <div key={index} className="flex flex-col items-end">
                                                                        <a
                                                                            href={getFilePreviewUrl(res?.url, res?.type)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className={`font-bold border-2 px-2 py-1 rounded-md text-[10px] whitespace-nowrap transition-all hover:scale-105 active:scale-95 ${res.status === 'APPROVED' ? 'text-green-600 border-green-200 bg-green-50' :
                                                                                res.status === 'REJECTED' ? 'text-red-600 border-red-200 bg-red-50' :
                                                                                    'text-amber-600 border-amber-200 bg-amber-50'
                                                                                }`}
                                                                        >
                                                                            {res?.name}
                                                                        </a>
                                                                        {res.status === 'REJECTED' && res.feedback && (
                                                                            <span className="text-[9px] text-red-500 mt-1 max-w-[120px] text-right italic leading-tight">
                                                                                Phản hồi: {res.feedback}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Chưa có kết quả</span>
                                                        )}

                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ));
                                })()}
                                {(!contract.services || contract.services.length === 0) && (
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

