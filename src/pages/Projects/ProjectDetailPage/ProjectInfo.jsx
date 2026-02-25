import { Calendar, Tag } from 'lucide-react';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../../utils/enums';
import { FileText } from 'lucide-react';

export const ProjectInfo = ({ project, formatDate }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Thông tin dự án</h2>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Mã hợp đồng</p>
                        <p className="text-sm font-medium text-gray-700">{project.contract.contractCode}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Tên hợp đồng</p>
                        <p className="text-sm font-medium text-gray-700">{project.contract.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Đội thực hiện</p>
                        <p className="text-sm font-medium text-gray-700">{project?.team?.name || 'Chưa phân công'}</p>
                    </div>
                </div>

                {/* <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Đội thực hiện</p>
                        <p className="text-sm font-medium text-gray-700">{project?.team?.name || 'Chưa phân công'}</p>
                    </div>
                </div> */}
                {project?.contract?.attachments && project?.contract?.attachments.length > 0 ? (
                    <div className="flex flex-col items-start gap-2 overflow-hidden">
                        <div>
                            <h2 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Mô tả khách hàng</h2>
                        </div>

                        {/* <div className="space-x-3 flex flex-row"> */}
                        <div className="flex flex-row flex-nowrap gap-3 overflow-x-auto w-full pb-2">
                            {project?.contract?.attachments.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 hover:bg-white transition-all"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-700 truncate text-ellipsis" title={file.name}>{file.name.length > 40 ? file.name.slice(0, 40) + '...' : file.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">{file.type}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic text-center py-4">Không có tài liệu đính kèm</p>
                )}
            </div>
        </div>
    );
};
