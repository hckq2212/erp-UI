
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
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
  const navigate = useNavigate();
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
        setIsModalOpen(false);
      } else {
        const newCustomer = await createCustomer(data).unwrap();
        toast.success('Tạo khách hàng thành công');
        setIsModalOpen(false);
        navigate(`/customers/${newCustomer.id}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleSearch = (term) => {
    setFilters(prev => ({ ...prev, search: term }));
  };

  const handleFilterSource = (source) => {
    const formatted = Array.isArray(source)
      ? (source.length > 0 ? source.join(',') : '')
      : (source || '');
    setFilters(prev => ({ ...prev, source: formatted }));
  };

  const handleReset = () => {
    setFilters({ search: '', source: '' });
  };

  const filteredCustomers = useMemo(() => {
    if (!customers || customers.length === 0) return [];
    return customers.filter(customer => {
      const term = (filters.search || '').trim().toLowerCase();
      const matchesSearch = !term ||
        customer.name?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.taxId?.toLowerCase().includes(term) ||
        customer.address?.toLowerCase().includes(term) ||
        customer.referralPartner?.name?.toLowerCase().includes(term);

      const sources = filters.source
        ? (typeof filters.source === 'string' ? filters.source.split(',').filter(Boolean) : filters.source)
        : [];
      const matchesSource = sources.length === 0 || sources.includes(customer.source);

      return matchesSearch && matchesSource;
    });
  }, [customers, filters.search, filters.source]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6 mt-6">

      <CustomerFilters
        searchTerm={filters.search}
        onSearch={handleSearch}
        sourceValue={filters.source}
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
            customers={filteredCustomers}
          />
        )}
      </div>

    </div>
  );
};

