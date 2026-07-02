import React from 'react';
import { Calendar, Search, RotateCcw, ChevronDown } from 'lucide-react';
import { DateInput } from '../ui/DateInput';
import { cn } from '../../utils/cn';

const PRESET_LABELS = {
    this_month: 'Tháng này',
    last_month: 'Tháng trước',
    this_quarter: 'Quý này',
    all: 'Tất cả',
    custom: 'Tùy chọn'
};

export const FinanceToolbar = ({
    preset,
    onPresetChange,
    rangeStart,
    rangeEnd,
    onRangeStartChange,
    onRangeEndChange,
    searchTerm,
    onSearchTermChange,
    debtStatusFilter,
    onDebtStatusFilterChange,
    onReset,
}) => {    return (
        <section className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-2 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-slate-400 shrink-0">
                        <Calendar className="w-4 h-4" strokeWidth={1.75} />
                    </div>

                    <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-200/30 w-full sm:w-auto overflow-x-auto">
                        {Object.keys(PRESET_LABELS).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onPresetChange(key)}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap active:scale-[0.98]",
                                    preset === key
                                        ? "bg-white text-slate-800 shadow-sm border border-slate-200/10"
                                        : "text-slate-500 hover:text-slate-800 hover:bg-white/20"
                                )}
                            >
                                {PRESET_LABELS[key]}
                            </button>
                        ))}
                    </div>

                    {preset === 'custom' && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full animate-in slide-in-from-left duration-200">
                            <div className="min-w-0">
                                <DateInput
                                    name="rangeStart"
                                    value={rangeStart || ''}
                                    onChange={(e) => onRangeStartChange(e.target.value)}
                                    placeholder="Từ ngày"
                                    className="py-1.5 px-3 text-sm rounded-xl border border-slate-200 bg-white"
                                />
                            </div>
                            <div className="min-w-0">
                                <DateInput
                                    name="rangeEnd"
                                    value={rangeEnd || ''}
                                    onChange={(e) => onRangeEndChange(e.target.value)}
                                    placeholder="Đến ngày"
                                    className="py-1.5 px-3 text-sm rounded-xl border border-slate-200 bg-white"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 lg:justify-end lg:items-center">
                    <div className="relative min-w-[240px] w-full sm:w-[300px]">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-50 focus-visible:border-indigo-500 transition-all font-medium text-slate-700 shadow-sm"
                            placeholder="Tìm mã hợp đồng, khách hàng..."
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                        />
                    </div>

                    <div className="relative w-full sm:w-[200px]">
                        <select
                            className="w-full pl-4 pr-10 py-1.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-indigo-50 focus-visible:border-indigo-500 transition-all appearance-none cursor-pointer font-bold shadow-sm"
                            value={debtStatusFilter}
                            onChange={(e) => onDebtStatusFilterChange(e.target.value)}
                        >
                            <option value="ALL">Tất cả công nợ</option>
                            <option value="HAS_DEBT">Còn nợ cần thu</option>
                            <option value="NO_DEBT">Đã hoàn thành thu</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                            <ChevronDown className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onReset}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 bg-white text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all active:scale-[0.98] border border-slate-200 shadow-sm"
                    >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Reset
                    </button>
                </div>
            </div>
        </section>
    );
};
