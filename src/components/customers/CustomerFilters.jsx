import { Search, Filter, RotateCcw } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const CustomerFilters = ({ onSearch, onFilterSource, onReset }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
      <div className="flex-1 relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
         </div>
         <Input 
            className="pl-10" 
            placeholder="Tìm kiếm theo tên, SĐT, email..." 
            onChange={(e) => onSearch(e.target.value)}
         />
      </div>
      
      <div className="w-full md:w-48">
        <select 
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            onChange={(e) => onFilterSource(e.target.value)}
        >
            <option value="">Tất cả nguồn</option>
            <option value="INTERNAL">Internal</option>
            <option value="REFERRAL_PARTNER">Referral Partner</option>
        </select>
      </div>

      <div>
        <Button variant="outline" onClick={onReset} className="w-full md:w-auto">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
        </Button>
      </div>
    </div>
  );
};
