import React from 'react';
import { Search, RotateCcw, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export const TableFilters = ({
    searchTerm,
    onSearchChange,
    filterValue,
    onFilterChange,
    filterOptions = [],
    filterPlaceholder = "Tất cả trạng thái",
    searchPlaceholder = "Tìm kiếm...",
    onReset
}) => {
    const hasOptions = filterOptions.length > 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 font-primary">
            <div className={cn("relative", hasOptions ? "md:col-span-2" : "md:col-span-3")}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {hasOptions && (
                <div className="relative">
                    <select
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 outline-none hover:bg-white focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer font-bold"
                        value={filterValue}
                        onChange={(e) => onFilterChange(e.target.value)}
                    >
                        <option value="ALL">{filterPlaceholder}</option>
                        {filterOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                </div>
            )}

            <div>
                <button
                    onClick={onReset}
                    className="w-full h-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-gray-500 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-gray-100 hover:text-blue-600 transition-all active:scale-95 border border-gray-100"
                >
                    <RotateCcw className="h-4 w-4" />
                    Làm mới
                </button>
            </div>
        </div>
    );
};
