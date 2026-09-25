import React, { useMemo } from 'react';
import Select from 'react-select';
import { Search, RotateCcw, X } from 'lucide-react';

const filterSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '46px',
    backgroundColor: '#F9FAFB',
    borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
    borderRadius: '0.75rem',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
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
    backgroundColor: '#EFF6FF',
    borderRadius: '0.5rem',
    border: '1px solid #BFDBFE',
    margin: '2px'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#1D4ED8',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '2px 6px'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#3B82F6',
    cursor: 'pointer',
    padding: '0 4px',
    borderRadius: '0 0.5rem 0.5rem 0',
    '&:hover': {
      backgroundColor: '#DBEAFE',
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
    backgroundColor: state.isSelected ? '#EFF6FF' : state.isFocused ? '#F3F4F6' : 'transparent',
    color: state.isSelected ? '#2563EB' : '#374151',
    fontWeight: state.isSelected ? 600 : 400
  })
};

const SOURCE_OPTIONS = [
  { value: 'INTERNAL', label: 'Nội bộ' },
  { value: 'REFERRAL_PARTNER', label: 'Đối tác giới thiệu' }
];

export const CustomerFilters = ({
  searchTerm = '',
  onSearch,
  sourceValue = '',
  onFilterSource,
  onReset
}) => {
  const selectedSource = useMemo(() => {
    if (!sourceValue || sourceValue === 'ALL') return [];
    const values = Array.isArray(sourceValue)
      ? sourceValue
      : (typeof sourceValue === 'string' ? sourceValue.split(',').map(s => s.trim()).filter(Boolean) : []);
    return SOURCE_OPTIONS.filter(opt => values.includes(opt.value));
  }, [sourceValue]);

  const handleSourceChange = (selected) => {
    const values = selected ? selected.map(s => s.value) : [];
    onFilterSource(values);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <div className="md:col-span-2 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium h-[46px]"
          placeholder="Tìm kiếm theo tên, SĐT, email, MST, đối tác..."
          value={searchTerm || ''}
          onChange={(e) => onSearch(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
            title="Xóa tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative">
        <Select
          options={SOURCE_OPTIONS}
          value={selectedSource}
          onChange={handleSourceChange}
          isMulti={true}
          isSearchable={true}
          isClearable={true}
          closeMenuOnSelect={false}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          noOptionsMessage={() => 'Không tìm thấy nguồn'}
          placeholder="Tất cả nguồn"
          styles={filterSelectStyles}
        />
      </div>

      <div>
        <button
          onClick={onReset}
          className="w-full h-[46px] flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-gray-500 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-gray-100 hover:text-blue-600 transition-all active:scale-95 border border-gray-100"
        >
          <RotateCcw className="h-4 w-4" />
          Làm mới
        </button>
      </div>
    </div>
  );
};
