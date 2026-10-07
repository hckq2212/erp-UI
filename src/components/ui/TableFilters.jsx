import React, { useMemo, useState, useEffect, memo } from 'react';
import Select from 'react-select';
import { Search, RotateCcw, X, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const filterSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '46px',
        backgroundColor: '#F9FAFB',
        borderColor: state.isFocused ? '#F38820' : '#E5E7EB',
        borderRadius: '0.75rem',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(243, 136, 32, 0.2)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#F38820' : '#D1D5DB',
            backgroundColor: '#FFFFFF'
        },
        padding: '0 4px',
        cursor: 'pointer'
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '2px 8px'
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        color: '#1F2937',
        fontSize: '0.875rem'
    }),
    placeholder: (base) => ({
        ...base,
        color: '#6B7280',
        fontSize: '0.875rem',
        fontWeight: 600
    }),
    singleValue: (base) => ({
        ...base,
        color: '#374151',
        fontSize: '0.875rem',
        fontWeight: 700
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: '#FFF7ED',
        borderRadius: '0.5rem',
        border: '1px solid #FED7AA',
        margin: '2px'
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: '#C2410C',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '2px 6px'
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: '#F38820',
        cursor: 'pointer',
        padding: '0 4px',
        borderRadius: '0 0.5rem 0.5rem 0',
        '&:hover': {
            backgroundColor: '#FFEDD5',
            color: '#DC2626'
        }
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({
        ...base,
        color: '#9CA3AF',
        padding: '4px'
    }),
    clearIndicator: (base) => ({
        ...base,
        color: '#9CA3AF',
        padding: '4px',
        cursor: 'pointer',
        '&:hover': {
            color: '#EF4444'
        }
    }),
    menuPortal: (base) => ({
        ...base,
        zIndex: 9999
    }),
    menu: (base) => ({
        ...base,
        zIndex: 9999,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #E5E7EB'
    }),
    menuList: (base) => ({
        ...base,
        maxHeight: '260px',
        padding: '4px'
    }),
    option: (base, state) => ({
        ...base,
        fontSize: '0.875rem',
        borderRadius: '0.5rem',
        padding: '8px 12px',
        margin: '1px 0',
        cursor: 'pointer',
        backgroundColor: state.isSelected ? '#FFF7ED' : state.isFocused ? '#F3F4F6' : 'transparent',
        color: state.isSelected ? '#F38820' : '#374151',
        fontWeight: state.isSelected ? 600 : 400,
        ':active': {
            backgroundColor: '#FFEDD5',
            color: '#C2410C'
        }
    })
};

const TableFiltersComponent = ({
    searchTerm,
    onSearchChange,
    filterValue,
    onFilterChange,
    filterOptions = [],
    filterPlaceholder = "Tất cả trạng thái",
    searchPlaceholder = "Tìm kiếm...",
    onReset,
    isMulti = false,
    isSearchable = true,
    useNativeSelect = false
}) => {
    const hasOptions = filterOptions.length > 0;
    const [localSearch, setLocalSearch] = useState(searchTerm || '');

    useEffect(() => {
        setLocalSearch(searchTerm || '');
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== (searchTerm || '')) {
                onSearchChange?.(localSearch);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [localSearch, onSearchChange, searchTerm]);

    const handleClearSearch = () => {
        setLocalSearch('');
        onSearchChange?.('');
    };

    const selectedValue = useMemo(() => {
        if (!filterOptions || filterOptions.length === 0) return isMulti ? [] : null;
        if (isMulti) {
            if (!filterValue || filterValue === 'ALL') return [];
            const values = Array.isArray(filterValue)
                ? filterValue
                : (typeof filterValue === 'string' ? filterValue.split(',').map(s => s.trim()).filter(Boolean) : []);
            return filterOptions.filter(opt => values.includes(opt.value));
        } else {
            if (!filterValue || filterValue === 'ALL') return null;
            return filterOptions.find(opt => opt.value === filterValue) || null;
        }
    }, [filterOptions, filterValue, isMulti]);

    const handleSelectChange = (selected) => {
        if (isMulti) {
            const values = selected ? selected.map(s => s.value) : [];
            onFilterChange(values);
        } else {
            onFilterChange(selected ? selected.value : 'ALL');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 font-primary">
            <div className={cn("relative", hasOptions ? "md:col-span-2" : "md:col-span-3")}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium h-[46px]"
                    placeholder={searchPlaceholder}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
                {localSearch && (
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                        title="Xóa tìm kiếm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {hasOptions && (
                <div className="relative">
                    {useNativeSelect ? (
                        <div className="relative">
                            <select
                                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 outline-none hover:bg-white focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer font-bold h-[46px]"
                                value={filterValue || 'ALL'}
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
                    ) : (
                        <Select
                            options={filterOptions}
                            value={selectedValue}
                            onChange={handleSelectChange}
                            isMulti={isMulti}
                            isSearchable={isSearchable}
                            isClearable={true}
                            closeMenuOnSelect={!isMulti}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            noOptionsMessage={() => 'Không tìm thấy lựa chọn'}
                            placeholder={filterPlaceholder}
                            styles={filterSelectStyles}
                        />
                    )}
                </div>
            )}

            <div>
                <button
                    onClick={onReset}
                    className="w-full h-[46px] flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-gray-500 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-gray-100 hover:text-[#F38820] transition-all active:scale-95 border border-gray-100"
                >
                    <RotateCcw className="h-4 w-4" />
                    Làm mới
                </button>
            </div>
        </div>
    );
};

export const TableFilters = memo(TableFiltersComponent);
