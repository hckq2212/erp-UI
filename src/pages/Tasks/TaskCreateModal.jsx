import { useState, useRef, useMemo, memo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Link as LinkIcon, Calendar, User, FileText, Trash2, Plus, ChevronDown, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetUsersQuery } from '../../api/users';
import { useCreateInternalTaskMutation } from '../../api/tasks';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { toast } from 'react-toastify';

const SearchableSelect = memo(({
    label,
    options,
    value,
    onChange,
    placeholder = "Chọn...",
    icon: Icon,
    searchPlaceholder = "Tìm kiếm...",
    noOptionsMessage = "Không tìm thấy kết quả"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    const selectedOption = useMemo(() =>
        options.find(opt => String(opt.value) === String(value)),
        [options, value]
    );

    const filteredOptions = useMemo(() =>
        options.filter(opt =>
            opt.label?.toLowerCase().includes(search.toLowerCase())
        ),
        [options, search]
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative group" ref={containerRef}>
            <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`relative cursor-pointer transition-all duration-200 border-2 rounded-2xl ${isOpen ? 'border-blue-500 bg-white ring-4 ring-blue-50' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                    }`}
            >
                <div className="flex items-center px-4 py-3.5 gap-3">
                    {Icon && <Icon className={`w-5 h-5 transition-colors ${isOpen ? 'text-blue-500' : 'text-gray-400'}`} />}
                    <span className={`flex-1 text-sm font-medium truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-[60] left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className="p-3 border-b border-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                    placeholder={searchPlaceholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${String(value) === String(option.value)
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-sm font-bold">{option.label}</span>
                                        {String(value) === String(option.value) && <Check className="w-4 h-4" />}
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-gray-400">
                                    <p className="text-sm font-medium">{noOptionsMessage}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

const TaskFields = memo(({ name, setName, supervisorId, setFormData, users }) => (
    <div className="space-y-5">
        <div>
            <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Tên công việc</label>
            <div className="relative group">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Nhập tên công việc..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
        </div>
        <SearchableSelect
            label="Người giám sát"
            icon={User}
            placeholder="Chọn người giám sát"
            searchPlaceholder="Tìm kiếm người giám sát..."
            value={supervisorId}
            onChange={(val) => setFormData(prev => ({ ...prev, supervisorId: val }))}
            options={users}
        />
    </div>
));

export const TaskCreateModal = memo(({ isOpen, onClose }) => {
    const { data: usersResult = [] } = useGetUsersQuery();
    const users = useMemo(() => Array.isArray(usersResult) ? usersResult : (usersResult?.data || []), [usersResult]);

    // Pre-calculate options for SearchableSelect
    const userOptions = useMemo(() => users.map(u => ({
        label: u.fullName || u.username,
        value: u.id
    })), [users]);

    const [createInternalTask, { isLoading: isCreating }] = useCreateInternalTaskMutation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Split state: Atomic states for high-frequency updates (text inputs)
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [links, setLinks] = useState(['']);

    // Other form state
    const [formData, setFormData] = useState({
        assigneeId: '',
        supervisorId: '',
        plannedStartDate: '',
        plannedEndDate: '',
    });

    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({}); // { index: progress }
    const [isUploading, setIsUploading] = useState(false);

    const handleAddLink = useCallback(() => {
        setLinks(prev => [...prev, '']);
    }, []);

    const handleRemoveLink = useCallback((index) => {
        setLinks(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleLinkChange = useCallback((index, value) => {
        setLinks(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const handleFileChange = useCallback((e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => {
            if (prev.length + selectedFiles.length > 5) {
                toast.warning('Chỉ được tối đa 5 file');
                return prev;
            }
            const totalSize = [...prev, ...selectedFiles].reduce((acc, f) => acc + f.size, 0);
            if (totalSize > 25 * 1024 * 1024) {
                toast.error('Tổng dung lượng file không được vượt quá 25MB');
                return prev;
            }
            return [...prev, ...selectedFiles];
        });
    }, []);

    const handleRemoveFile = useCallback((index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleFieldChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!name) {
            toast.error('Vui lòng nhập tên công việc');
            return;
        }
        if (!formData.assigneeId) {
            toast.error('Vui lòng chọn người thực hiện');
            return;
        }
        if (!formData.supervisorId) {
            toast.error('Vui lòng chọn người giám sát');
            return;
        }
        if (!formData.plannedEndDate) {
            toast.error('Vui lòng chọn thời hạn (Deadline)');
            return;
        }

        try {
            let attachments = [];

            // 1. Handle Links
            const validLinks = links.filter(l => l.trim() !== '').map(l => ({
                type: 'LINK',
                name: l,
                url: l
            }));
            attachments.push(...validLinks);

            // 2. Handle Files (Direct Upload)
            if (files.length > 0) {
                setIsUploading(true);
                const uploadPromises = files.map((file, index) =>
                    uploadToCloudinary(
                        file,
                        'GETVINI/ERP/tasks', // Default folder
                        (progress) => setUploadProgress(prev => ({ ...prev, [index]: progress }))
                    )
                );

                const uploadedFiles = await Promise.all(uploadPromises);
                attachments.push(...uploadedFiles);
                setIsUploading(false);
            }

            const result = await createInternalTask({
                name,
                assigneeId: formData.assigneeId,
                supervisorId: formData.supervisorId,
                description,
                plannedStartDate: formData.plannedStartDate || undefined,
                plannedEndDate: formData.plannedEndDate,
                attachments
            }).unwrap();

            toast.success('Tạo công việc thành công');
            onClose();
            navigate(`/tasks/${result.id}`);
        } catch (err) {
            setIsUploading(false);
            toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo công việc');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                            <Plus className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 uppercase">Tạo công việc</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    <TaskFields
                        name={name}
                        setName={setName}
                        supervisorId={formData.supervisorId}
                        setFormData={setFormData}
                        users={userOptions}
                    />

                    <SearchableSelect
                        label="Người thực hiện"
                        icon={User}
                        placeholder="Chọn người thực hiện"
                        searchPlaceholder="Tìm kiếm người thực hiện..."
                        value={formData.assigneeId}
                        onChange={(val) => handleFieldChange('assigneeId', val)}
                        options={userOptions}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Bắt đầu</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="datetime-local"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                                    value={formData.plannedStartDate}
                                    onChange={(e) => handleFieldChange('plannedStartDate', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Thời hạn</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="datetime-local"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                                    value={formData.plannedEndDate}
                                    onChange={(e) => handleFieldChange('plannedEndDate', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Mô tả</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                            <textarea
                                rows="3"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-bold text-sm"
                                placeholder="Nhập mô tả công việc..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-bold text-gray-700 uppercase ml-1">Liên kết đính kèm</label>
                            <button
                                type="button"
                                onClick={handleAddLink}
                                className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Thêm link
                            </button>
                        </div>
                        <div className="space-y-3">
                            {links.map((link, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                                            value={link}
                                            onChange={(e) => handleLinkChange(index, e.target.value)}
                                        />
                                    </div>
                                    {links.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLink(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Tài liệu đính kèm (Tối đa 5 file, 25MB)</label>
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                            <p className="text-sm text-gray-500">Tải tệp lên hoặc kéo thả vào đây</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                            />
                        </div>

                        {files.length > 0 && (
                            <div className="mt-4 space-y-3">
                                {files.map((file, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{file.name}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(index)}
                                                className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                                disabled={isUploading}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {isUploading && uploadProgress[index] !== undefined && (
                                            <div className="mt-1 px-3">
                                                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress[index]}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form >

                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        disabled={isCreating || isUploading}
                        onClick={handleSubmit}
                        className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:bg-blue-300 disabled:shadow-none"
                    >
                        {isCreating || isUploading ? 'Đang xử lý...' : 'Xác nhận tạo'}
                    </button>
                </div>
            </div>
        </div>
    );
});
