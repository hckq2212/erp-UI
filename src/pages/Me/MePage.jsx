import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useGetMeQuery, useUpdateMeMutation } from '../../api/auth';
import { selectCurrentUser } from '../../store/authSlice';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { toast } from 'react-toastify';
import {
    User, Mail, Phone, Lock, Unlock, Save, Loader2,
    Info, Calendar, Camera, Link2, ExternalLink,
    Shield, X, Plus, Eye, EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { maskIdCardNumber } from '../../utils/format';

const AVATAR_FOLDER = 'GETVINI/ERP/avatars';
const MAX_IMG_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const toDateInputValue = (value) => {
    if (!value) return '';
    return String(value).slice(0, 10);
};

const isValidImageFile = (file) =>
    ALLOWED_IMG_TYPES.includes(file.type) && file.size <= MAX_IMG_SIZE;

// ─── HobbiesTagInput Component ─────────────────────────────────────────────
const HobbiesTagInput = ({ tags = [], onChange }) => {
    const [input, setInput] = useState('');

    const addTag = (raw) => {
        const trimmed = raw.trim();
        if (!trimmed || tags.includes(trimmed) || tags.length >= 15) return;
        onChange([...tags, trimmed]);
        setInput('');
    };

    const removeTag = (idx) => onChange(tags.filter((_, i) => i !== idx));

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div className="min-h-[52px] w-full px-3 py-2 bg-gray-50 border-2 border-transparent focus-within:border-blue-100 focus-within:bg-white rounded-2xl transition-all flex flex-wrap gap-2 items-center cursor-text">
            {tags.map((tag, i) => (
                <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold px-2.5 py-1 rounded-full"
                >
                    {tag}
                    <button type="button" onClick={() => removeTag(i)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => addTag(input)}
                placeholder={tags.length === 0 ? 'Gõ rồi nhấn Enter hoặc dấu phẩy...' : ''}
                className="flex-1 min-w-[140px] bg-transparent outline-none text-sm font-bold text-gray-700 placeholder:font-normal placeholder:text-gray-400"
            />
        </div>
    );
};

// ─── Main MePage ───────────────────────────────────────────────────────────
export const MePage = () => {
    const user = useSelector(selectCurrentUser);
    const { refetch } = useGetMeQuery();
    const [updateMe, { isLoading: isUpdating }] = useUpdateMeMutation();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showIdNumber, setShowIdNumber] = useState(false);
    const [isIdNumberFocused, setIsIdNumberFocused] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '', phoneNumber: '', birthday: '', email: '',
        password: '', confirmPassword: '',
        avatarUrl: '', portfolioUrl: '',
        hobbies: [],
        idCard: { idNumber: '' },
    });

    // Local preview states (before upload)
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || '',
                birthday: toDateInputValue(user.birthday),
                email: user.email || '',
                password: '', confirmPassword: '',
                avatarUrl: user.avatarUrl || '',
                portfolioUrl: user.portfolioUrl || '',
                hobbies: Array.isArray(user.hobbies) ? user.hobbies : [],
                idCard: {
                    idNumber: user.idCard?.idNumber || '',
                },
            });
            setAvatarPreview(user.avatarUrl || null);
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleIdCardChange = (e) => {
        const { name, value } = e.target;
        if (name === 'idNumber') {
            const numeric = value.replace(/\D/g, '').slice(0, 12);
            setFormData(prev => ({ ...prev, idCard: { ...prev.idCard, idNumber: numeric } }));
        } else {
            setFormData(prev => ({ ...prev, idCard: { ...prev.idCard, [name]: value } }));
        }
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!isValidImageFile(file)) {
            toast.error('Ảnh đại diện phải là JPG/PNG/WEBP và tối đa 5MB');
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        const cleanIdNumber = formData.idCard?.idNumber ? String(formData.idCard.idNumber).trim() : '';
        if (cleanIdNumber && !/^([0-9]{9}|[0-9]{12})$/.test(cleanIdNumber)) {
            toast.error('Số CCCD / CMND phải gồm đúng 9 hoặc 12 chữ số');
            return;
        }

        try {
            setIsUploading(true);
            const updateData = {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                birthday: formData.birthday || null,
                email: formData.email,
                portfolioUrl: formData.portfolioUrl || null,
                hobbies: formData.hobbies,
            };

            if (formData.password) updateData.password = formData.password;

            // Upload avatar if new file selected
            if (avatarFile) {
                const result = await uploadToCloudinary(avatarFile, AVATAR_FOLDER);
                updateData.avatarUrl = result.url;
            }

            // Update CCCD number
            updateData.idCard = cleanIdNumber ? { idNumber: cleanIdNumber } : null;

            await updateMe(updateData).unwrap();
            toast.success('Cập nhật hồ sơ thành công');
            setAvatarFile(null);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            refetch();
        } catch (err) {
            toast.error(err.data?.message || err.message || 'Cập nhật thất bại');
        } finally {
            setIsUploading(false);
        }
    };

    if (!user) return null;

    const isBusy = isUpdating || isUploading;
    const initials = user.fullName?.[0] || user.username?.[0] || '?';

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* ── Header / Avatar ── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 mt-2 rounded-[0.5rem] border border-gray-100 shadow-sm"
            >
                <div className="flex items-center gap-6">
                    {/* Avatar upload */}
                    <label className="relative group cursor-pointer shrink-0">
                        <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-100 ring-8 ring-blue-50">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-4xl">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 rounded-[2rem] bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={isBusy} />
                    </label>

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{user.fullName || 'Người dùng'}</h1>
                            <div className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black uppercase">{user.role}</div>
                        </div>
                        <p className="text-sm text-gray-400">Nhấp vào ảnh đại diện để thay đổi</p>
                    </div>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Section 1: Thông tin cá nhân ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Info className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">Thông tin cá nhân</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Họ tên */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Họ và tên</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                    placeholder="Nhập họ tên đầy đủ" />
                            </div>
                        </div>

                        {/* Ngày sinh */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Ngày sinh</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input type="date" name="birthday" value={formData.birthday} onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm" />
                            </div>
                        </div>

                        {/* Số điện thoại */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Số điện thoại</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                    placeholder="Nhập số điện thoại" />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Email liên lạc</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                    placeholder="Nhập địa chỉ email" />
                            </div>
                        </div>
                    </div>

                    {/* Portfolio */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Link Portfolio</label>
                        <div className="flex gap-2">
                            <div className="relative group flex-1">
                                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input type="url" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                    placeholder="https://behance.net/your-portfolio" />
                            </div>
                            {formData.portfolioUrl && (
                                <a href={formData.portfolioUrl} target="_blank" rel="noreferrer"
                                    className="shrink-0 flex items-center justify-center w-14 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border-2 border-transparent">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Sở thích (Tags) */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                            Sở thích cá nhân
                            <span className="ml-2 text-gray-300 font-normal normal-case">— Gõ rồi nhấn Enter hoặc dấu phẩy</span>
                        </label>
                        <HobbiesTagInput
                            tags={formData.hobbies}
                            onChange={(tags) => setFormData(prev => ({ ...prev, hobbies: tags }))}
                        />
                    </div>
                </motion.div>

                {/* ── Section 2: CCCD / CMND ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Căn cước công dân (CCCD / CMND)</h2>
                                <p className="text-[11px] text-gray-400 mt-0.5">🛡️ Số định danh cá nhân được mã hóa bảo mật, chỉ bạn và Quản lý có thể xem</p>
                            </div>
                        </div>
                    </div>

                    {/* ID number */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Số CCCD / CMND (9 hoặc 12 chữ số)</label>
                            {formData.idCard.idNumber && (
                                <button
                                    type="button"
                                    onClick={() => setShowIdNumber(prev => !prev)}
                                    className="text-[11px] font-bold text-gray-500 hover:text-orange-600 flex items-center gap-1.5 transition-colors"
                                    title={showIdNumber ? "Khóa lại / Che bớt số CCCD" : "Mở khóa / Xem đầy đủ số CCCD"}
                                >
                                    {showIdNumber ? (
                                        <>
                                            <Unlock className="w-3.5 h-3.5 text-orange-500" />
                                            <span className="text-orange-600 font-bold">Đang hiện đầy đủ</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Mở khóa xem đủ</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                name="idNumber"
                                value={
                                    showIdNumber || isIdNumberFocused
                                        ? formData.idCard.idNumber
                                        : maskIdCardNumber(formData.idCard.idNumber)
                                }
                                onFocus={() => setIsIdNumberFocused(true)}
                                onBlur={() => setIsIdNumberFocused(false)}
                                onChange={handleIdCardChange}
                                maxLength={12}
                                className="w-full pl-5 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm tracking-widest font-mono"
                                placeholder="012 345 678 901"
                            />
                            {formData.idCard.idNumber && (
                                <button
                                    type="button"
                                    onClick={() => setShowIdNumber(prev => !prev)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-600 focus:outline-none transition-colors"
                                    title={showIdNumber ? "Khóa lại / Che số CCCD" : "Mở khóa / Xem số CCCD"}
                                >
                                    {showIdNumber ? <Unlock className="w-5 h-5 text-orange-500" /> : <Lock className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── Section 3: Mật khẩu ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">Thay đổi mật khẩu</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Mật khẩu mới</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-5 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Xác nhận mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-5 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(prev => !prev)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                    title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 italic">* Để trống nếu không muốn thay đổi mật khẩu</p>
                </motion.div>

                {/* ── Submit ── */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isBusy}
                        className="py-4 px-8 bg-[#F38820] text-white rounded-[0.5rem] font-black text-base shadow-lg shadow-orange-100 hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center gap-3"
                    >
                        {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isBusy ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
};
