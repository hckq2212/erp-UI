
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { CustomerModal } from './CustomerModal';
import { CustomerFilters } from '../../components/customers/CustomerFilters';
import { CustomerTable } from '../../components/customers/CustomerTable';
import { Plus } from 'lucide-react';
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
  useCreateCustomerMutation,
  useUpdateCustomerMutation
} from '../../api/customers';
import { toast } from 'react-toastify';

export const CustomersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    source: ''
  });

  const { data: customers = [], isLoading } = useGetCustomersQuery(filters);
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  }

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };


  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khách hàng này?')) {
      try {
        await deleteCustomer(id).unwrap();
        toast.success('Xóa khách hàng thành công');
      } catch (err) {
        toast.error(err?.data?.message || 'Có lỗi xảy ra khi xóa');
      }
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (selectedCustomer) {
        await updateCustomer({ id: selectedCustomer.id, ...data }).unwrap();
        toast.success('Cập nhật khách hàng thành công');
      } else {
        await createCustomer(data).unwrap();
        toast.success('Tạo khách hàng thành công');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleSearch = (term) => {
    setFilters(prev => ({ ...prev, search: term }));
  };

  const handleFilterSource = (source) => {
    setFilters(prev => ({ ...prev, source }));
  };

  const handleReset = () => {
    setFilters({ search: '', source: '' });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>Quản Lý Khách Hàng</h1>
          <p className="text-gray-500 text-sm mt-1">Danh sách thông tin khách hàng </p>
        </div>
        <Button onClick={handleCreate} className="w-full md:w-auto shadow-lg shadow-blue-500/20">
          <Plus className='h-5 w-5 mr-2' />
          Thêm Khách Hàng
        </Button>
      </div>

      <CustomerFilters
        onSearch={handleSearch}
        onFilterSource={handleFilterSource}
        onReset={handleReset}
      />

      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách khách hàng...</p>
          </div>
        ) : (
          <CustomerTable
            customers={customers}
          />
        )}
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
};

