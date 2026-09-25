import { useState, useRef, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { Search, RotateCcw, Filter, User, Calendar, X, AlertCircle, Clock, CalendarDays, ChevronDown } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { TASK_STATUS_LABELS } from '../../utils/enums';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/format';

const assigneeSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '44px',
        borderRadius: '0.75rem',
        borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
        backgroundColor: state.isFocused ? '#FFFFFF' : '#F9FAFB',
        boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
        cursor: 'pointer',
        '&:hover': { borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB' }
    }),
    valueContainer: (base) => ({ ...base, paddingLeft: '2.75rem' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({ ...base, color: '#9CA3AF', paddingRight: '0.875rem' }),
    placeholder: (base) => ({ ...base, color: '#6B7280', fontSize: '0.875rem' }),
    singleValue: (base) => ({ ...base, color: '#4B5563', fontSize: '0.875rem' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({ ...base, zIndex: 9999, borderRadius: '0.75rem', overflow: 'hidden' }),
    option: (base, state) => ({
        ...base,
        fontSize: '0.875rem',
        cursor: 'pointer',
        backgroundColor: state.isSelected ? '#2563EB' : state.isFocused ? '#EFF6FF' : '#FFFFFF',
        color: state.isSelected ? '#FFFFFF' : '#374151'
    })
};

const statusSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '44px',
        borderRadius: '0.75rem',
        borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
        backgroundColor: state.isFocused ? '#FFFFFF' : '#F9FAFB',
        boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
        cursor: 'pointer',
        '&:hover': { borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB' }
    }),
    valueContainer: (base) => ({ ...base, paddingLeft: '0.75rem', paddingRight: '0.5rem' }),
    input: (base) => ({ ...base, margin: 0, padding: 0, color: '#1F2937', fontSize: '0.875rem' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({ ...base, color: '#9CA3AF', paddingRight: '0.75rem' }),
    clearIndicator: (base) => ({
        ...base,
        color: '#9CA3AF',
        padding: '0 4px',
        cursor: 'pointer',
        '&:hover': { color: '#EF4444' }
    }),
    placeholder: (base) => ({ ...base, color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }),
    singleValue: (base) => ({ ...base, color: '#4B5563', fontSize: '0.875rem', fontWeight: 500 }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: '#EFF6FF',
        borderRadius: '0.375rem',
        border: '1px solid #BFDBFE',
        margin: '1px'
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: '#1D4ED8',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '1px 5px'
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: '#3B82F6',
        cursor: 'pointer',
        padding: '0 3px',
        borderRadius: '0 0.375rem 0.375rem 0',
        '&:hover': { backgroundColor: '#DBEAFE', color: '#DC2626' }
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({ ...base, zIndex: 9999, borderRadius: '0.75rem', overflow: 'hidden' }),
    option: (base, state) => ({
        ...base,
        fontSize: '0.875rem',
        cursor: 'pointer',
        backgroundColor: state.isSelected ? '#EFF6FF' : state.isFocused ? '#F3F4F6' : '#FFFFFF',
        color: state.isSelected ? '#2563EB' : '#374151',
        fontWeight: state.isSelected ? 600 : 400
    })
};

const DATE_TYPE_OPTIONS = [
    { value: 'plannedEndDate', label: 'Hạn chót (Deadline)', shortLabel: 'Hạn chót' },
    { value: 'actualEndDate', label: 'Hoàn thành thực tế', shortLabel: 'Hoàn thành' },
    { value: 'plannedRange', label: 'Kế hoạch triển khai', shortLabel: 'Kế hoạch chạy' },
    { value: 'actualStartDate', label: 'Bắt đầu thực tế', shortLabel: 'Bắt đầu' }
];

export const TaskFilters = ({
    filters,
    onFilterChange,
    onMultipleFilterChange,
    onReset,
    canFilterByAssignee = false,
    users = [],
    isLoadingUsers = false,
    showQuickPresets = true,
    className = ''
}) => {
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const popoverRef = useRef(null);

    const updateMultiple = onMultipleFilterChange || ((updates) => {
        Object.entries(updates).forEach(([k, v]) => onFilterChange(k, v));
    });

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const currentMonthNumber = format(today, 'MM');
    const startWeekStr = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const endWeekStr = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const startMonthStr = format(startOfMonth(today), 'yyyy-MM-dd');
    const endMonthStr = format(endOfMonth(today), 'yyyy-MM-dd');

    const isTodayActive = filters.deadline === 'today' ||
        (filters.deadline === todayStr && !filters.deadlineFrom && !filters.deadlineTo) ||
        (filters.deadlineFrom === todayStr && filters.deadlineTo === todayStr);

    const isThisWeekActive = filters.deadlineFrom === startWeekStr && filters.deadlineTo === endWeekStr;
    const isThisMonthActive = filters.deadlineFrom === startMonthStr && filters.deadlineTo === endMonthStr;

    // Handle click outside popover
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsDatePopoverOpen(false);
            }
        };
        if (isDatePopoverOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDatePopoverOpen]);

    const activeDateType = filters.dateType || 'plannedEndDate';
    const activeDateTypeObj = DATE_TYPE_OPTIONS.find(o => o.value === activeDateType) || DATE_TYPE_OPTIONS[0];

    const getDateDisplayLabel = () => {
        let text = '';
        if (isTodayActive) text = 'Hôm nay';
        else if (isThisWeekActive) text = 'Tuần này';
        else if (isThisMonthActive) text = `Tháng ${currentMonthNumber} (${format(startOfMonth(today), 'dd/MM')} - ${format(endOfMonth(today), 'dd/MM')})`;
        else if (filters.deadlineFrom && filters.deadlineTo) {
            if (filters.deadlineFrom === filters.deadlineTo) {
                text = formatDate(filters.deadlineFrom);
            } else {
                text = `${formatDate(filters.deadlineFrom)} - ${formatDate(filters.deadlineTo)}`;
            }
        }
        else if (filters.deadlineFrom) text = `Từ ${formatDate(filters.deadlineFrom)}`;
        else if (filters.deadlineTo) text = `Đến ${formatDate(filters.deadlineTo)}`;
        else if (filters.deadline && filters.deadline !== 'today') text = formatDate(filters.deadline);

        if (!text) return '';
        return `${activeDateTypeObj.shortLabel}: ${text}`;
    };

    const dateDisplayLabel = getDateDisplayLabel();

    const assigneeOptions = [
        { value: '', label: 'Tất cả nhân sự' },
        ...users
            .map((user) => ({ value: user.id, label: user.fullName || user.account?.username || 'Chưa có tên' }))
            .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
    ];
    const selectedAssignee = assigneeOptions.find(option => option.value === filters.assigneeId) || assigneeOptions[0];

    const statusOptions = useMemo(() => [
        ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
            value,
            label
        }))
    ], []);

    const selectedStatuses = useMemo(() => {
        if (!filters.status || filters.status === 'ALL') return [];
        const values = Array.isArray(filters.status)
            ? filters.status
            : (typeof filters.status === 'string' ? filters.status.split(',').map(s => s.trim()).filter(Boolean) : []);
        return statusOptions.filter(opt => values.includes(opt.value));
    }, [statusOptions, filters.status]);

    const handleStatusChange = (selected) => {
        const values = selected ? selected.map(s => s.value) : [];
        onFilterChange('status', values.length > 0 ? values.join(',') : 'ALL');
    };

    const hasActiveFilters = Boolean(
        filters.search ||
        (filters.status && filters.status !== 'ALL') ||
        filters.assigneeId ||
        filters.deadline ||
        filters.deadlineFrom ||
        filters.deadlineTo ||
        filters.projectId
    );

    return (
        <div className={cn("bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-3", className)}>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${canFilterByAssignee ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3 items-center`}>
                {/* Search */}
                <div className="sm:col-span-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none h-[44px]"
                        placeholder="Tìm theo tên task, mã task hoặc dự án..."
                        value={filters.search || ''}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                    />
                    {filters.search && (
                        <button
                            type="button"
                            onClick={() => onFilterChange('search', '')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                            title="Xóa tìm kiếm"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Status */}
                <div className="relative">
                    <Select
                        aria-label="Lọc theo trạng thái"
                        options={statusOptions}
                        value={selectedStatuses}
                        onChange={handleStatusChange}
                        isMulti={true}
                        isSearchable={true}
                        isClearable={true}
                        closeMenuOnSelect={false}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        noOptionsMessage={() => 'Không tìm thấy trạng thái'}
                        placeholder="Tất cả trạng thái"
                        styles={statusSelectStyles}
                    />
                </div>

                {/* Unified Date Range Trigger Field with Popover */}
                <div className="relative" ref={popoverRef}>
                    <button
                        type="button"
                        onClick={() => setIsDatePopoverOpen(!isDatePopoverOpen)}
                        className={cn(
                            "w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm transition-all cursor-pointer h-[44px] text-left outline-none",
                            dateDisplayLabel
                                ? "border-orange-300 bg-orange-50/50 text-orange-950 font-medium"
                                : "border-gray-200 text-gray-600 hover:bg-white focus:ring-2 focus:ring-blue-500"
                        )}
                    >
                        <div className="flex items-center gap-2 min-w-0 pr-1 truncate">
                            <Calendar className={cn("h-4 w-4 shrink-0", dateDisplayLabel ? "text-orange-500" : "text-gray-400")} />
                            <span className="truncate text-xs sm:text-sm">
                                {dateDisplayLabel || 'Hạn chót: Tất cả'}
                            </span>
                        </div>

                        {dateDisplayLabel ? (
                            <div
                                role="button"
                                tabIndex={0}
                                title="Xóa lọc thời gian"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateMultiple({ deadline: '', deadlineFrom: '', deadlineTo: '', dateType: 'plannedEndDate' });
                                }}
                                className="p-0.5 hover:bg-orange-200/60 rounded-full text-orange-600 hover:text-orange-800 transition-colors shrink-0"
                            >
                                <X className="h-3.5 w-3.5" />
                            </div>
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                        )}
                    </button>

                    {/* Popover Dropdown */}
                    {isDatePopoverOpen && (
                        <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-40 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Lọc mốc thời gian</span>
                                {dateDisplayLabel && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateMultiple({ deadline: '', deadlineFrom: '', deadlineTo: '', dateType: 'plannedEndDate' });
                                            setIsDatePopoverOpen(false);
                                        }}
                                        className="text-[11px] font-semibold text-red-500 hover:text-red-700 hover:underline"
                                    >
                                        Xóa lọc
                                    </button>
                                )}
                            </div>

                            {/* Date Type Selector */}
                            <div>
                                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Tiêu chí mốc thời gian
                                </span>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {DATE_TYPE_OPTIONS.map(opt => {
                                        const isSelected = activeDateType === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => updateMultiple({ dateType: opt.value })}
                                                className={cn(
                                                    "text-left px-2.5 py-1.5 rounded-xl text-xs transition-all border flex items-center justify-between",
                                                    isSelected
                                                        ? "bg-orange-50 border-orange-300 text-orange-900 font-bold shadow-xs"
                                                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                                )}
                                            >
                                                <span className="truncate">{opt.label}</span>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 ml-1" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quick Presets in Popover */}
                            <div className="pt-2 border-t border-gray-100">
                                <span className="block text-[11px] font-semibold text-gray-400 mb-1.5">Phím tắt nhanh</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateMultiple({ deadline: 'today', deadlineFrom: '', deadlineTo: '' });
                                            setIsDatePopoverOpen(false);
                                        }}
                                        className={cn(
                                            "px-2 py-1.5 text-xs rounded-lg font-medium transition-all text-center",
                                            isTodayActive ? "bg-orange-500 text-white font-bold shadow-xs" : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                                        )}
                                    >
                                        Hôm nay
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateMultiple({ deadline: '', deadlineFrom: startWeekStr, deadlineTo: endWeekStr });
                                            setIsDatePopoverOpen(false);
                                        }}
                                        className={cn(
                                            "px-2 py-1.5 text-xs rounded-lg font-medium transition-all text-center",
                                            isThisWeekActive ? "bg-orange-500 text-white font-bold shadow-xs" : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                                        )}
                                    >
                                        Tuần này
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateMultiple({ deadline: '', deadlineFrom: startMonthStr, deadlineTo: endMonthStr });
                                            setIsDatePopoverOpen(false);
                                        }}
                                        className={cn(
                                            "px-2 py-1.5 text-xs rounded-lg font-medium transition-all text-center truncate",
                                            isThisMonthActive ? "bg-orange-500 text-white font-bold shadow-xs" : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                                        )}
                                    >
                                        Tháng {currentMonthNumber}
                                    </button>
                                </div>
                            </div>

                            {/* Custom Date Pickers */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <span className="block text-[11px] font-semibold text-gray-400 mb-1">Khoảng ngày tùy chọn</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Từ ngày</label>
                                        <input
                                            type="date"
                                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all cursor-pointer"
                                            value={filters.deadlineFrom || (filters.deadline && filters.deadline !== 'today' ? filters.deadline : '')}
                                            onChange={(e) => updateMultiple({ deadlineFrom: e.target.value, deadline: '' })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Đến ngày</label>
                                        <input
                                            type="date"
                                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all cursor-pointer"
                                            value={filters.deadlineTo || (filters.deadline && filters.deadline !== 'today' ? filters.deadline : '')}
                                            onChange={(e) => updateMultiple({ deadlineTo: e.target.value, deadline: '' })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsDatePopoverOpen(false)}
                                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
                                >
                                    Hoàn tất
                                </button>
                            </div>
                        </div>
                    )}
                </div>


                {/* Assignee (if permission) */}
                {canFilterByAssignee && (
                    <div className="relative min-w-0">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                            <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <Select
                            inputId="task-assignee-filter"
                            aria-label="Lọc công việc theo người thực hiện"
                            options={assigneeOptions}
                            value={selectedAssignee}
                            onChange={(option) => onFilterChange('assigneeId', option?.value || '')}
                            isLoading={isLoadingUsers}
                            isDisabled={isLoadingUsers}
                            isSearchable
                            noOptionsMessage={() => 'Không tìm thấy nhân sự'}
                            loadingMessage={() => 'Đang tải nhân sự...'}
                            styles={assigneeSelectStyles}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        />
                    </div>
                )}

                {/* Reset Button */}
                <div>
                    <button
                        type="button"
                        onClick={onReset}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-all active:scale-95 h-[44px]"
                    >
                        <RotateCcw className="h-4 w-4" />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Quick Presets Bar: Time & Status Matrix */}
            {showQuickPresets && <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
                <span className="text-gray-400 font-medium mr-1 shrink-0 whitespace-nowrap">Thời gian:</span>
                
                {/* Preset: Hôm nay */}
                <button
                    type="button"
                    onClick={() => updateMultiple(
                        isTodayActive
                            ? { deadline: '', deadlineFrom: '', deadlineTo: '' }
                            : { deadline: 'today', deadlineFrom: '', deadlineTo: '' }
                    )}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 whitespace-nowrap",
                        isTodayActive
                            ? "bg-orange-500 text-white shadow-sm shadow-orange-200 font-semibold"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                    )}
                >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Hôm nay</span>
                </button>

                {/* Preset: Tuần này */}
                <button
                    type="button"
                    onClick={() => updateMultiple(
                        isThisWeekActive
                            ? { deadline: '', deadlineFrom: '', deadlineTo: '' }
                            : { deadline: '', deadlineFrom: startWeekStr, deadlineTo: endWeekStr }
                    )}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 whitespace-nowrap",
                        isThisWeekActive
                            ? "bg-orange-500 text-white shadow-sm shadow-orange-200 font-semibold"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                    )}
                >
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Tuần này</span>
                </button>

                {/* Preset: Tháng này */}
                <button
                    type="button"
                    onClick={() => updateMultiple(
                        isThisMonthActive
                            ? { deadline: '', deadlineFrom: '', deadlineTo: '' }
                            : { deadline: '', deadlineFrom: startMonthStr, deadlineTo: endMonthStr }
                    )}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 whitespace-nowrap",
                        isThisMonthActive
                            ? "bg-orange-500 text-white shadow-sm shadow-orange-200 font-semibold"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                    )}
                >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Tháng này (Tháng {currentMonthNumber})</span>
                </button>

                <div className="h-4 w-[1px] bg-gray-200 mx-1 shrink-0" />

                <span className="text-gray-400 font-medium mr-1 shrink-0 whitespace-nowrap">Trạng thái:</span>

                {/* Status: Quá hạn */}
                <button
                    type="button"
                    onClick={() => onFilterChange('status', filters.status === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 whitespace-nowrap",
                        filters.status === 'OVERDUE'
                            ? "bg-red-500 text-white shadow-sm shadow-red-200 font-semibold"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                    )}
                >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Quá hạn</span>
                </button>

                {/* Status: Đang làm */}
                <button
                    type="button"
                    onClick={() => onFilterChange('status', filters.status === 'DOING' ? 'ALL' : 'DOING')}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 whitespace-nowrap",
                        filters.status === 'DOING'
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-200 font-semibold"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                    )}
                >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Đang thực hiện</span>
                </button>

                {/* Status: Cần làm lại */}
                <button
                    type="button"
                    onClick={() => onFilterChange('status', filters.status === 'REWORKING' ? 'ALL' : 'REWORKING')}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 whitespace-nowrap",
                        filters.status === 'REWORKING'
                            ? "bg-amber-500 text-white shadow-sm shadow-amber-200 font-semibold"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                    )}
                >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Cần làm lại</span>
                </button>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-auto font-medium shrink-0 whitespace-nowrap"
                    >
                        <X className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Xóa tất cả bộ lọc</span>
                    </button>
                )}
            </div>}
        </div>
    );
};
