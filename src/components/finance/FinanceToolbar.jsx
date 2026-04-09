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
}) => {
    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 pt-4 pb-3 flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                        <Calendar className="w-4 h-4" />

                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 w-full sm:w-auto overflow-x-auto">
                        {Object.keys(PRESET_LABELS).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onPresetChange(key)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap",
                                    preset === key
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                )}
                            >
                                {PRESET_LABELS[key]}
                            </button>
                        ))}
                    </div>

                    {preset === 'custom' && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <div className="min-w-0">
                                <DateInput
                                    name="rangeStart"
                                    value={rangeStart || ''}
                                    onChange={(e) => onRangeStartChange(e.target.value)}
                                    placeholder="Từ ngày"
                                    className="py-2 text-sm"
                                />
                            </div>
                            <div className="min-w-0">
                                <DateInput
                                    name="rangeEnd"
                                    value={rangeEnd || ''}
                                    onChange={(e) => onRangeEndChange(e.target.value)}
                                    placeholder="Đến ngày"
                                    className="py-2 text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 lg:justify-end lg:items-center">
                    <div className="relative min-w-[240px] w-full sm:w-[320px]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:bg-white transition-all font-semibold"
                            placeholder="Tìm mã hợp đồng, khách hàng..."
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                        />
                    </div>

                    <div className="relative w-full sm:w-[220px]">
                        <select
                            className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-400/70 transition-all appearance-none cursor-pointer font-black"
                            value={debtStatusFilter}
                            onChange={(e) => onDebtStatusFilterChange(e.target.value)}
                        >
                            <option value="ALL">Tất cả công nợ</option>
                            <option value="HAS_DEBT">Còn nợ cần thu</option>
                            <option value="NO_DEBT">Đã hoàn thành thu</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onReset}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-100 hover:text-blue-600 transition-all active:scale-[0.99] border border-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </button>
                </div>
            </div>

        </section>
    );
};
