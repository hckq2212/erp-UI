import { Edit, Trash2, Eye, Phone, Mail, MapPin, Hash, Users, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../ui/Pagination';

export const CustomerTable = ({ customers = [], onEdit, onDelete, onView }) => {
  const navigate = useNavigate();
  const {
    data: paginatedCustomers,
    sortConfig,
    requestSort,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems
  } = useTableFeatures(customers, { initialSort: { key: 'name', direction: 'ascending' } });

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
      : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  const renderSortableHeader = (label, sortKey, align = 'left') => (
    <th
      className={cn(
        "px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100/50 transition-colors group",
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
      )}
      onClick={() => requestSort(sortKey)}
    >
      <div className={cn("flex items-center", align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start')}>
        {label}
        {getSortIcon(sortKey)}
      </div>
    </th>
  );

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[1300px]">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              {renderSortableHeader('Khách Hàng', 'name')}
              {renderSortableHeader('Mã số thuế', 'taxId')}
              <th className="px-6 py-4 font-semibold">Thông tin liên hệ</th>
              <th className="px-6 py-4 font-semibold">Địa Chỉ</th>
              {renderSortableHeader('Nguồn', 'source', 'center')}
              <th className="px-6 py-4 font-semibold text-right">Xem chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedCustomers && paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{customer.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {customer.taxId || '---'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-600 gap-2">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-medium">{customer.phone}</span>
                      </div>
                      <div className="flex items-center text-gray-400 gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-300" />
                        <span className="truncate max-w-[150px]">{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 text-gray-500 max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-red-300 flex-shrink-0" />
                      <span className="text-xs line-clamp-2" title={customer.address}>
                        {customer.address}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "px-3 py-1 inline-flex text-[10px] font-bold uppercase rounded-lg tracking-wider",
                      customer.source === 'INTERNAL'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    )}>
                      {customer.source === 'INTERNAL' ? 'Nội bộ' : 'Đối tác'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="p-2 text-white bg-blue-600 rounded-xl transition-all font-bold px-4"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-50 rounded-full">
                      <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-medium italic">Chưa có khách hàng nào trong hệ thống</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
      />
    </div>
  );
};
