import { Search, RotateCcw } from 'lucide-react';

export const CustomerFilters = ({ onSearch, onFilterSource, onReset }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <div className="md:col-span-2 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          placeholder="Tìm kiếm theo tên, SĐT, email..."
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="relative">
        <select
          className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 outline-none hover:bg-white focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
          onChange={(e) => onFilterSource(e.target.value)}
        >
          <option value="">Tất cả nguồn</option>
          <option value="INTERNAL">Nội bộ</option>
          <option value="REFERRAL_PARTNER">Đối tác</option>
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div>
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          Làm mới
        </button>
      </div>
    </div>
  );
};
