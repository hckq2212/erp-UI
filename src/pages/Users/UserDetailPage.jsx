import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Mail, Phone, Shield, User,
    MapPin, Calendar, CheckCircle, Clock, XCircle,
    Briefcase, Activity
} from 'lucide-react';
import { useGetUserQuery } from '../../api/users';

export const UserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: user, isLoading, error } = useGetUserQuery(id);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="bg-red-50 p-6 rounded-2xl text-red-600 text-center space-y-4">
                <p className="font-bold">Không tìm thấy thông tin nhân sự</p>
                <button
                    onClick={() => navigate('/users')}
                    className="bg-white border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors inline-flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </button>
            </div>
        );
    }

    const tasks = user.tasks || [];
    const totalPages = Math.ceil(tasks.length / itemsPerPage);
    const paginatedTasks = tasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DONE':
            case 'COMPLETED':
                return <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border border-green-100 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> DONE</span>;
            case 'DOING':
                return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border border-blue-100 flex items-center gap-1"><Activity className="w-3 h-3" /> DOING</span>;
            case 'PENDING':
                return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border border-amber-100 flex items-center gap-1"><Clock className="w-3 h-3" /> PENDING</span>;
            case 'REJECTED':
                return <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border border-red-100 flex items-center gap-1"><XCircle className="w-3 h-3" /> REJECTED</span>;
            default:
                return <span className="bg-gray-50 text-gray-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border border-gray-100">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <button
                onClick={() => navigate('/users')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Quay lại danh sách nhân sự</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 text-center bg-gradient-to-b from-blue-50 to-white pt-10">
                            <div className="w-24 h-24 bg-blue-600 text-white rounded-3xl flex items-center justify-center font-black text-4xl mx-auto shadow-xl shadow-blue-100 mb-6">
                                {user.fullName?.[0]}
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1">{user.fullName}</h1>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-black uppercase">
                                <Shield className="w-3.5 h-3.5" />
                                {user.account?.role}
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thông tin liên hệ</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                        <span className="truncate">{user.account?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <Phone className="w-4 h-4 text-blue-500" />
                                        <span>{user.phoneNumber || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <User className="w-4 h-4 text-blue-500" />
                                        <span>Username: <span className="font-bold text-gray-900">@{user.account?.username}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Tasks & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Công việc được giao</h3>
                                    <p className="text-sm text-gray-500">Danh sách các task đang phụ trách</p>
                                </div>
                            </div>
                            <div className="text-2xl font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl">
                                {tasks.length}
                            </div>
                        </div>

                        <div className="space-y-3 flex-1">
                            {paginatedTasks.length > 0 ? (
                                paginatedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                        className="p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-2xl transition-all cursor-pointer group"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-mono font-black text-gray-400">
                                                        {task.code || `#${task.id}`}
                                                    </span>
                                                    {getStatusBadge(task.status)}
                                                </div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {task.name}
                                                </h4>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0 hidden md:block" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 italic">Chưa có công việc nào được phân công</p>
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>

                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === i + 1
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                                : 'text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChevronLeft = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m15 18-6-6 6-6" />
    </svg>
);

const ChevronRight = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);
