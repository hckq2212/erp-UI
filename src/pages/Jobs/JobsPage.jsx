import { useGetJobsQuery } from '../../api/jobs';
import { formatCurrency } from '../../utils/format';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';
import { CreateJobModal } from './CreateJobModal';

export const JobsPage = () => {
    const { data: jobs = [], isLoading } = useGetJobsQuery();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>Quản Lý Hạng Mục Dịch Vụ</h1>
                    <p className="text-gray-500 text-sm mt-1">Danh sách chi tiết các hạng mục công việc</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Hạng Mục
                </Button>
            </div>

            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách hạng mục...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã Hạng Mục</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên Hạng Mục</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá vốn</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Xem chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.code}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{job.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(job.costPrice)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <button className="text-white bg-blue-600 rounded-md px-2 py-1">Xem chi tiết</button>
                                        </td>
                                    </tr>
                                ))}
                                {jobs.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                            Không tìm thấy hạng mục công việc nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateJobModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
