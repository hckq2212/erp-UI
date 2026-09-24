import { useState, useMemo, useRef, useEffect } from 'react';
import {
    format,
    addDays,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    startOfWeek,
    endOfWeek,
    differenceInDays,
    isWithinInterval,
    parseISO,
    startOfDay,
    endOfDay
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Briefcase, User, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../utils/enums';
import { useNavigate } from 'react-router-dom';
import { getTaskDisplayName } from '../../utils/taskName';

export const TaskSchedule = ({ tasks = [] }) => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const scrollRef = useRef(null);

    // Generate days for the current view (4 weeks starting from current date's start of week)
    const days = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({
            start,
            end: addDays(start, 27) // 4 weeks
        });
    }, [currentDate]);

    // Sync scroll to today if exists in view
    useEffect(() => {
        if (scrollRef.current) {
            const todayIndex = days.findIndex(day => isToday(day));
            if (todayIndex !== -1) {
                const dayWidth = 120; // Matches CSS
                scrollRef.current.scrollLeft = (todayIndex * dayWidth) - (scrollRef.current.clientWidth / 2) + (dayWidth / 2);
            }
        }
    }, [days]);

    const handlePrev = () => setCurrentDate(prev => addDays(prev, -7));
    const handleNext = () => setCurrentDate(prev => addDays(prev, 7));

    const getTaskPosition = (task, daysInterval) => {
        if (!task.plannedEndDate) return null;

        // If no start date, default to 1 day duration ending at plannedEndDate
        const startDate = task.plannedStartDate ? parseISO(task.plannedStartDate) : parseISO(task.plannedEndDate);
        const endDate = parseISO(task.plannedEndDate);

        const viewStart = startOfDay(daysInterval[0]);
        const viewEnd = endOfDay(daysInterval[daysInterval.length - 1]);

        // Check if task overlaps with current view
        const taskStart = startOfDay(startDate);
        const taskEnd = endOfDay(endDate);

        if (taskEnd < viewStart || taskStart > viewEnd) return null;

        const actualStart = taskStart < viewStart ? viewStart : taskStart;
        const actualEnd = taskEnd > viewEnd ? viewEnd : taskEnd;

        const leftOffset = differenceInDays(actualStart, viewStart);
        const width = differenceInDays(actualEnd, actualStart) + 1;

        return {
            left: `${leftOffset * 120}px`,
            width: `${width * 120}px`,
            isStartOutside: taskStart < viewStart,
            isEndOutside: taskEnd > viewEnd
        };
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
            {/* Schedule Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-20">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        Lịch Trình Công Việc
                    </h3>
                    <span className="text-sm text-gray-500 font-medium px-3 py-1 bg-gray-50 rounded-lg">
                        {format(days[0], 'dd/MM')} - {format(days[days.length - 1], 'dd/MM/yyyy')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                        Hôm nay
                    </button>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded-lg shadow-sm transition-all">
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-white rounded-lg shadow-sm transition-all">
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline Container */}
            <div className="flex-1 overflow-auto bg-gray-50/50" ref={scrollRef}>
                <div className="inline-flex min-w-full flex-col relative">

                    {/* Timeline Header (Sticky) */}
                    <div className="sticky top-0 z-10 flex bg-white border-b border-gray-200">
                        <div className="w-64 flex-shrink-0 p-4 font-bold text-xs text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-white">
                            Công việc / Dự án
                        </div>
                        {days.map((day) => (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "w-[120px] flex-shrink-0 p-3 text-center border-r border-gray-100",
                                    isToday(day) && "bg-blue-50/50"
                                )}
                            >
                                <div className={cn(
                                    "text-[10px] font-bold uppercase",
                                    isToday(day) ? "text-blue-600" : "text-gray-400"
                                )}>
                                    {format(day, 'EEE', { locale: vi })}
                                </div>
                                <div className={cn(
                                    "text-sm font-black mt-0.5 h-7 w-7 flex items-center justify-center mx-auto rounded-full",
                                    isToday(day) ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-gray-700"
                                )}>
                                    {format(day, 'dd')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="relative">
                        {tasks.map((task) => {
                            const pos = getTaskPosition(task, days);
                            return (
                                <div key={task.id} className="flex border-b border-gray-100 group hover:bg-white transition-colors">
                                    {/* Task Info Sidebar */}
                                    <div
                                        className="w-64 flex-shrink-0 p-4 border-r border-gray-100 bg-white group-hover:bg-blue-50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                    >
                                        <div className="text-[10px] font-mono text-blue-600 font-bold truncate mb-1">{task.code}</div>
                                        <div className="text-xs font-bold text-gray-900 line-clamp-2 leading-relaxed">{getTaskDisplayName(task)}</div>
                                        <div className="flex items-center gap-1.5 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Briefcase className="w-3 h-3 text-gray-400" />
                                            <span className="text-[10px] text-gray-500 font-medium truncate">{task.project?.name}</span>
                                        </div>
                                    </div>

                                    {/* Task Timeline Row */}
                                    <div className="flex relative items-center h-20 bg-transparent">
                                        {/* Visual grid lines */}
                                        {days.map((day) => (
                                            <div
                                                key={day.toString()}
                                                className={cn(
                                                    "w-[120px] h-full flex-shrink-0 border-r border-gray-100/50 pointer-events-none",
                                                    isToday(day) && "bg-blue-50/10"
                                                )}
                                            />
                                        ))}

                                        {/* Task Bar */}
                                        {pos && (
                                            <div
                                                className={cn(
                                                    "absolute h-9 rounded-xl flex items-center px-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all z-1 shadow-sm border",
                                                    TASK_STATUS_COLORS[task.status] || "bg-gray-100 border-gray-200"
                                                )}
                                                style={{
                                                    left: pos.left,
                                                    width: pos.width,
                                                    marginLeft: '1px' // Grid offset
                                                }}
                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden w-full">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-inherit whitespace-nowrap bg-white/20 px-1.5 py-0.5 rounded">
                                                        {task.status === 'COMPLETED'
                                                            ? 'DONE'
                                                            : task.status === 'PENDING'
                                                                ? 'WAIT'
                                                                : task.status === 'NOT_STARTED'
                                                                    ? 'CHƯA LÀM'
                                                                    : 'DOING'}
                                                    </span>
                                                    <span className="text-[10px] font-bold truncate text-inherit">
                                                        {task.code}
                                                    </span>
                                                </div>

                                                {/* Outside indicators */}
                                                {pos.isStartOutside && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/10 to-transparent rounded-l-xl" />
                                                )}
                                                {pos.isEndOutside && (
                                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/10 to-transparent rounded-r-xl" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty State */}
                        {tasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-20 text-gray-400 bg-white">
                                <p>Không có công việc nào để hiển thị trên lịch trình</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Legend */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest overflow-x-auto whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200 shadow-sm" />
                    <span>Chờ xử lý</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 shadow-sm" />
                    <span>Đang thực hiện</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200 shadow-sm" />
                    <span>Hoàn thành</span>
                </div>
                <div className="ml-auto flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>Thời điểm hiện tại</span>
                </div>
            </div>
        </div>
    );
};
