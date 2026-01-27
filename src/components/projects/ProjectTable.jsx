import { Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const getStatusColor = (status) => {
    switch (status) {
        case 'Planning': return 'bg-blue-100 text-blue-800';
        case 'InProgress': return 'bg-yellow-100 text-yellow-800';
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'OnHold': return 'bg-orange-100 text-orange-800';
        case 'Cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export const ProjectTable = ({ projects, onView, onEdit, onDelete }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã DA</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Dự Án</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bắt Đầu</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kết Thúc</th>
                         <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {projects?.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 clickable" onClick={() => onView(project)}>
                                {project.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.startDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.endDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={cn("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", getStatusColor(project.status))}>
                                    {project.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                    <button onClick={() => onView(project)} className="text-gray-400 hover:text-gray-600">
                                        <Eye className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onEdit(project)} className="text-blue-400 hover:text-blue-600">
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onDelete(project.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
