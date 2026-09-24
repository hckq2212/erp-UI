import { BadgeCheck, ClipboardList, Clock, Loader2, CheckCircle2, UserMinus } from 'lucide-react';
import { TASK_STATUS } from '../../../utils/enums';

export const TaskStatistics = ({ tasks = [] }) => {
    const stats = {
        total: tasks.filter(t => t.status !== TASK_STATUS.CANCELLED).length,

        unassigned: tasks.filter(t =>
            t.status !== TASK_STATUS.CANCELLED &&
            !t.assigneeId &&
            !t.assignee?.id &&
            !t.helperId &&
            !t.helper?.id &&
            !t.vendorId &&
            !t.vendor?.id
        ).length,
        
        issues: tasks.filter(t => 
            t.status === TASK_STATUS.OVERDUE || 
            t.status === TASK_STATUS.REJECTED
        ).length,
        
        inProgress: tasks.filter(t => 
            t.status === TASK_STATUS.PENDING || 
            t.status === TASK_STATUS.NOT_STARTED ||
            t.status === TASK_STATUS.DOING || 
            t.status === TASK_STATUS.REWORKING || 
            t.status === TASK_STATUS.AWAITING_PRICING || 
            t.status === TASK_STATUS.AWAITING_SUPPORT || 
            t.status === TASK_STATUS.SUPPORT_PENDING || 
            t.status === TASK_STATUS.SUPPORT_AWAITING_RETURN
        ).length,
        
        completed: tasks.filter(t => 
            t.status === TASK_STATUS.INTERNAL_COMPLETED || 
            t.status === TASK_STATUS.AWAITING_REVIEW || 
            t.status === TASK_STATUS.AWAITING_ACCEPTANCE || 
            t.status === TASK_STATUS.COMPLETED || 
            t.status === TASK_STATUS.ACCEPTED || 
            t.status === TASK_STATUS.DONE
        ).length,

        accepted: tasks.filter(t => t.status === TASK_STATUS.ACCEPTED).length
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[1.5rem] flex items-center gap-4 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tổng cộng</p>
                    <p className="text-2xl font-extrabold text-slate-800 leading-none">{stats.total}</p>
                </div>
            </div>

            <div className="bg-sky-50/50 border border-sky-100/60 p-5 rounded-[1.5rem] flex items-center gap-4 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
                    <UserMinus className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-sky-600/80 uppercase tracking-widest mb-1">Chưa phân công</p>
                    <p className="text-2xl font-extrabold text-sky-900 leading-none">{stats.unassigned}</p>
                </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100/60 p-5 rounded-[1.5rem] flex items-center gap-4 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100">
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-rose-600/80 uppercase tracking-widest mb-1">Cần xử lý</p>
                    <p className="text-2xl font-extrabold text-rose-900 leading-none">{stats.issues}</p>
                </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-100/60 p-5 rounded-[1.5rem] flex items-center gap-4 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <Loader2 className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest mb-1">Đang triển khai</p>
                    <p className="text-2xl font-extrabold text-amber-900 leading-none">{stats.inProgress}</p>
                </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100/60 p-5 rounded-[1.5rem] flex items-center gap-4 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest mb-1">Hoàn thành</p>
                    <p className="text-2xl font-extrabold text-emerald-900 leading-none">{stats.completed}</p>
                </div>
            </div>

            <div className="bg-teal-50/50 border border-teal-100/60 p-5 rounded-[1.5rem] flex items-center gap-4 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-100">
                    <BadgeCheck className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-teal-600/80 uppercase tracking-widest mb-1">Đã nghiệm thu</p>
                    <p className="text-2xl font-extrabold text-teal-900 leading-none">{stats.accepted}</p>
                </div>
            </div>
        </div>
    );
};
