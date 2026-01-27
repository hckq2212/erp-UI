
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { CustomerModal } from './CustomerModal';
import { CustomerFilters } from '../../components/customers/CustomerFilters';
import { CustomerTable } from '../../components/customers/CustomerTable';
import { Plus } from 'lucide-react';

export const CustomersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const { data: customers, isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  }

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleView = (customer) => {
      alert('Viewing details for');
  }

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc muốn xóa khách hàng này?')) {
      await deleteCustomer.mutateAsync(id);
    }
  };

  const handleSubmit = async (data) => {
    if (selectedCustomer) {
        await updateCustomer.mutateAsync({ id: selectedCustomer.id, data });
    } else {
        await createCustomer.mutateAsync(data);
    }
    setIsModalOpen(false);
  };

  const handleSearch = (term) => console.log('Searching:', term);
  const handleFilterSource = (source) => console.log('Filtering source:', source);
  const handleReset = () => console.log('Resetting filters');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold text-gray-900'>Quản Lý Khách Hàng</h1>
        <Button onClick={handleCreate}>
            <Plus className='h-5 w-5 mr-2' />
            Thêm Khách Hàng
        </Button>
      </div>

      <CustomerFilters 
        onSearch={handleSearch}
        onFilterSource={handleFilterSource}
        onReset={handleReset}
      />

      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <CustomerTable 
            customers={customers} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onView={handleView}
        />
        
        <div className='bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6'>
            <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                <div>
                    <p className='text-sm text-gray-700'>
                        Showing <span className='font-medium'>1</span> to <span className='font-medium'>10</span> of <span className='font-medium'>20</span> results
                    </p>
                </div>
                <div>
                   <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px' aria-label='Pagination'>
                        <button className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'>
                            Previous
                        </button>
                        <button className='relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50'>
                            1
                        </button>
                         <button className='relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50'>
                            2
                        </button>
                        <button className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'>
                            Next
                        </button>
                   </nav>
                </div>
            </div>
        </div>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />
    </div>
  );
};

