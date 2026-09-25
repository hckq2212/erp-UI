import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetMeQuery, useUpdateMeMutation } from '../../api/auth';
import { selectCurrentUser } from '../../store/authSlice';
import { toast } from 'react-toastify';
import {
    User, Mail, Phone, Lock, Save, Loader2,
    Shield, Briefcase, Star, Info, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

export const MePage = () => {
    const user = useSelector(selectCurrentUser);
    const { refetch } = useGetMeQuery();
    const [updateMe, { isLoading: isUpdating }] = useUpdateMeMutation();

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || '',
                email: user.email || '',
                password: '',
                confirmPassword: ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            const updateData = {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                email: formData.email
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            await updateMe(updateData).unwrap();
            toast.success('Cập nhật hồ sơ thành công');
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            refetch();
        } catch (err) {
            toast.error(err.data?.message || err.message || 'Cập nhật thất bại');
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 mt-2 rounded-[0.5rem] border border-gray-100 shadow-sm"
            >
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-2xl shadow-blue-100 ring-8 ring-blue-50">
                        {user.fullName?.[0] || user.username?.[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{user.fullName || 'Người dùng'}</h1>
                            <div className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                {user.role}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-4 bg-amber-50/50 px-6 py-4 rounded-[1.5rem] border border-amber-100/50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-1">Khả dụng</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                                            <p className="text-[10px] font-black text-white m-0">V</p>
                                        </div>
                                        <span className="text-xl font-black text-amber-600 leading-none">
                                            {user.vinicoin?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-amber-200/30 mx-2" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-1">Tổng cộng</span>
                                    <span className="text-xl font-black text-gray-800 leading-none">
                                        {user.vinicoinTotal?.toLocaleString() || 0}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-amber-200/30 mx-2" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-1">Đã rút</span>
                                    <span className="text-xl font-black text-gray-400 leading-none">
                                        {user.vinicoinWithdrawn?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Form Side */}
                <div className="lg:col-span-3">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-10 rounded-[0.5rem] border border-gray-100 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <Info className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Cập nhật hồ sơ</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Họ và tên</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                            placeholder="Nhập họ tên đầy đủ"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Số điện thoại</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Email liên lạc</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                        placeholder="Nhập địa chỉ email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">Thay đổi mật khẩu</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Xác nhận mật khẩu</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <p className="mt-3 text-[10px] text-gray-400 italic">* Để trống nếu không muốn thay đổi mật khẩu</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-fit mt-10 py-5 px-5 bg-blue-600 text-white rounded-[0.5rem] font-black text-base shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-3 tracking-tight"
                            >
                                {isUpdating ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <Save className="w-6 h-6" />
                                )}
                                Lưu thay đổi
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
