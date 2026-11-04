import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ExternalLink, FileText } from 'lucide-react';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../../utils/enums';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/format';
import { getTaskDisplayName } from '../../../utils/taskName';

export const ExtraTasksSection = ({ tasks = [] }) => {
    const navigate = useNavigate();

    const extraTasks = useMemo(() => {
        return tasks
            .filter((task) => task.isExtra)
            .sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }));
    }, [tasks]);

    const summary = useMemo(() => ({
        total: extraTasks.length
    }), [extraTasks]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Công việc phát sinh</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Danh sách các công việc ngoài phạm vi ban đầu của dự án.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                        <SummaryPill label="Tổng" value={summary.total} />
                    </div>
                </div>
            </div>

            {extraTasks.length === 0 ? (
                <div className="p-10 text-center">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm italic text-gray-500">Dự án chưa có công việc phát sinh.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50/70 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Mã</th>
                                <th className="px-5 py-3 font-semibold">Công việc</th>
                                <th className="px-5 py-3 font-semibold">Trạng thái</th>
                                <th className="px-5 py-3 font-semibold text-right">Tạo ngày</th>
                                <th className="px-5 py-3 font-semibold text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {extraTasks.map((task) => {
                                return (
                                    <tr key={task.id} className="hover:bg-gray-50/60">
                                        <td className="px-5 py-4">
                                            <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-500">
                                                {task.code || '---'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-gray-900">{getTaskDisplayName(task)}</div>
                                            <div className="mt-1 text-xs text-gray-500">{task.job?.name || task.name}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={cn(
                                                'inline-flex rounded-lg border px-2 py-1 text-xs font-bold',
                                                TASK_STATUS_COLORS[task.status] || 'bg-gray-50 text-gray-500 border-gray-100'
                                            )}>
                                                {TASK_STATUS_LABELS[task.status] || task.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right text-gray-500">
                                            {formatDate(task.createdAt) || '---'}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 transition-all hover:bg-gray-200 active:scale-95"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Xem
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const SummaryPill = ({ label, value, className }) => (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className={cn('text-lg font-black text-gray-800', className)}>{value}</p>
    </div>
);
