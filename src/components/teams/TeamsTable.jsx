import { useNavigate } from 'react-router-dom';
import { Users, User, ArrowRight } from 'lucide-react';

export const TeamsTable = ({ teams }) => {
    const navigate = useNavigate();

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tên Đội
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trưởng Nhóm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thành Viên
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thao Tác
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {teams?.map((team) => (
                        <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-semibold text-gray-900">{team.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {team.teamLead ? (
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">{team.teamLead.fullName || team.teamLead.username}</div>
                                            <div className="text-xs text-gray-500">{team.teamLead.email}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Chưa có Lead</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="font-medium text-gray-900">{team.members?.length || 0}</span>
                                    <span className="ml-1">thành viên</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => navigate(`/teams/${team.id}`)}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    Chi tiết
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {(!teams || teams.length === 0) && (
                        <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                Chưa có đội dự án nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
