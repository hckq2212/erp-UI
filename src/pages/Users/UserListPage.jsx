import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, ChevronRight, Mail, Phone, Shield } from 'lucide-react';
import { useGetUsersQuery } from '../../api/users';

export const UserListPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const { data: users = [], isLoading, error } = useGetUsersQuery();

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.account?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.account?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'ALL' || user.account?.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-50 text-red-700 border-red-100';
            case 'TL': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'EMP': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-xl text-red-600 text-center">
                Có lỗi xảy ra khi tải danh sách nhân sự.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Danh sách nhân sự</h1>
                    <p className="text-gray-500 text-sm mt-1">Quản lý thông tin nhân viên trong hệ thống</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, username, email..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700 min-w-[150px]"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả vai trò</option>
                        <option value="ADMIN">Admin</option>
                        <option value="TL">Team Lead</option>
                        <option value="EMP">Employee</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                    <div
                        key={user.id}
                        onClick={() => navigate(`/users/${user.id}`)}
                        className="group bg-white p-5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {user.fullName?.[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {user.fullName}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-mono">@{user.account?.username}</p>
                                </div>
                            </div>
                            <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${getRoleBadgeColor(user.account?.role)}`}>
                                {user.account?.role}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{user.account?.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{user.phoneNumber || '—'}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-xs text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Xem chi tiết <ChevronRight className="w-3 h-3" />
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <Shield className="w-3 h-3" />
                                Verified
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-lg">Không tìm thấy nhân sự phù hợp</p>
                    <button
                        onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); }}
                        className="text-blue-600 font-bold mt-2 hover:underline"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            )}
        </div>
    );
};
