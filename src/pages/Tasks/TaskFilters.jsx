import Select from 'react-select';
import { Search, RotateCcw, Filter, User } from 'lucide-react';
import { TASK_STATUS_LABELS } from '../../utils/enums';

const assigneeSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '46px',
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
    menu: (base) => ({ ...base, zIndex: 30, borderRadius: '0.75rem', overflow: 'hidden' }),
    option: (base, state) => ({
        ...base,
        fontSize: '0.875rem',
        cursor: 'pointer',
        backgroundColor: state.isSelected ? '#2563EB' : state.isFocused ? '#EFF6FF' : '#FFFFFF',
        color: state.isSelected ? '#FFFFFF' : '#374151'
    })
};

export const TaskFilters = ({
    filters,
    onFilterChange,
    onReset,
    canFilterByAssignee = false,
    users = [],
    isLoadingUsers = false
}) => {
    const assigneeOptions = [
        { value: '', label: 'Tất cả nhân sự' },
        ...users
            .map((user) => ({ value: user.id, label: user.fullName || user.account?.username || 'Chưa có tên' }))
            .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
    ];
    const selectedAssignee = assigneeOptions.find(option => option.value === filters.assigneeId) || assigneeOptions[0];

    return (
        <div className={`grid grid-cols-1 ${canFilterByAssignee ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6`}>
            <div className="md:col-span-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    placeholder="Tìm theo tên task, mã task hoặc dự án..."
                    value={filters.search}
                    onChange={(e) => onFilterChange('search', e.target.value)}
                />
            </div>

            <div className="relative">
                <select
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 outline-none hover:bg-white focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                    value={filters.status}
                    onChange={(e) => onFilterChange('status', e.target.value)}
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                </div>
            </div>

            {canFilterByAssignee && (
                <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
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
                    />
                </div>
            )}

            <div>
                <button
                    onClick={onReset}
                    className="w-full h-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                >
                    <RotateCcw className="h-4 w-4" />
                    Làm mới
                </button>
            </div>
        </div>
    );
};
