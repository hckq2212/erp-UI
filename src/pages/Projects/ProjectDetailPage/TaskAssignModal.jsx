import { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Calendar, User, FileText, Trash2, Plus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetTeamMembersQuery } from '../../../api/teams';
import { useAssignTaskMutation } from '../../../api/tasks';
import { useGetVendorsByJobQuery } from '../../../api/vendors';
import { toast } from 'react-toastify';

export const TaskAssignModal = ({ isOpen, onClose, task, project }) => {
    const teamId = project?.team?.id;
    const { data: members = [] } = useGetTeamMembersQuery(teamId, { skip: !teamId });
    const [assignTask, { isLoading: isAssigning }] = useAssignTaskMutation();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        assigneeId: '',
        performerType: 'INTERNAL',
        plannedEndDate: '',
        plannedStartDate: '',
        description: '',
        links: [''],
    });

    const jobId = task?.jobId || task?.job?.id;
    const { data: vendorsResult, isLoading: isLoadingVendors } = useGetVendorsByJobQuery(jobId, {
        skip: formData.performerType !== 'VENDOR' || !jobId
    });
    const vendors = Array.isArray(vendorsResult) ? vendorsResult : (vendorsResult?.data || []);
    const [files, setFiles] = useState([]);

    const handleAddLink = () => {
        setFormData({ ...formData, links: [...formData.links, ''] });
    };

    const handleRemoveLink = (index) => {
        const newLinks = formData.links.filter((_, i) => i !== index);
        setFormData({ ...formData, links: newLinks });
    };

    const handleLinkChange = (index, value) => {
        const newLinks = [...formData.links];
        newLinks[index] = value;
        setFormData({ ...formData, links: newLinks });
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            toast.warning('Chỉ được tối đa 5 file');
            return;
        }

        const totalSize = [...files, ...selectedFiles].reduce((acc, f) => acc + f.size, 0);
        if (totalSize > 25 * 1024 * 1024) {
            toast.error('Tổng dung lượng file không được vượt quá 25MB');
            return;
        }

        setFiles([...files, ...selectedFiles]);
    };

    const handleRemoveFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formData.assigneeId) {
            toast.error('Vui lòng chọn người thực hiện');
            return;
        }

        try {
            const data = new FormData();
            data.append('assigneeId', formData.assigneeId);
            data.append('performerType', formData.performerType);
            if (formData.plannedEndDate) {
                data.append('plannedEndDate', formData.plannedEndDate);
            }
            if (formData.plannedStartDate) {
                data.append('plannedStartDate', formData.plannedStartDate);
            }
            if (formData.description) {
                data.append('description', formData.description);
            }
            const links = formData.links.filter(link => link.trim() !== '');
            if (links.length > 0) {
                data.append('links', JSON.stringify(links.map(url => ({ type: 'LINK', name: url, url }))));
            }

            files.forEach(file => {
                data.append('files', file);
            });

            await assignTask({ id: task.id, formData: data }).unwrap();
            toast.success('Phân công công việc thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi phân công');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: "spring",
                            duration: 0.4,
                            bounce: 0.2,
                            opacity: { duration: 0.2 },
                            scale: { duration: 0.3 }
                        }}
                        style={{ willChange: "transform, opacity" }}
                        className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative transform-gpu"
                    >
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <User className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Phân công công việc</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[11px] font-bold tracking-wider">{task.code}</span>
                                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{task.name}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-600 hover:rotate-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 overscroll-contain" style={{ webkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}>
                            {/* Performer Type Selector */}
                            <div className="space-y-4">
                                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hình thức thực hiện</label>
                                <div className="flex p-1.5 bg-slate-100/80 rounded-2xl relative">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, performerType: 'INTERNAL', assigneeId: '' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all relative z-10 ${formData.performerType === 'INTERNAL' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Info className="w-4 h-4" /> Nội bộ
                                        {formData.performerType === 'INTERNAL' && (
                                            <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10" />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, performerType: 'VENDOR', assigneeId: '' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all relative z-10 ${formData.performerType === 'VENDOR' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Briefcase className="w-4 h-4" /> Vendor
                                        {formData.performerType === 'VENDOR' && (
                                            <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Assignee Selection */}
                            <div className="space-y-3">
                                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                    {formData.performerType === 'INTERNAL' ? 'Người thực hiện' : 'Đối tác Vendor'}
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                        <User className="w-full h-full" />
                                    </div>
                                    <select
                                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-slate-700 font-medium"
                                        value={formData.assigneeId}
                                        onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                    >
                                        <option value="">
                                            {formData.performerType === 'VENDOR' && isLoadingVendors
                                                ? 'Đang tải danh sách...'
                                                : `Chọn ${formData.performerType === 'INTERNAL' ? 'người thực hiện' : 'vendor'}`}
                                        </option>
                                        {formData.performerType === 'INTERNAL' ? (
                                            members.map(m => (
                                                <option key={m.user.id} value={m.user.id}>{m.user.fullName}</option>
                                            ))
                                        ) : (
                                            vendors.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))
                                        )}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {formData.performerType === 'VENDOR' && vendors.length === 0 && !isLoadingVendors && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold ring-1 ring-red-100 animate-in fade-in slide-in-from-top-1">
                                        <Info className="w-4 h-4" /> Chưa có vendor cung cấp dịch vụ này
                                    </div>
                                )}
                            </div>

                            {/* Dates Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ngày bắt đầu</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="date"
                                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                                            value={formData.plannedStartDate}
                                            onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hạn nộp</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="date"
                                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                                            value={formData.plannedEndDate}
                                            onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ghi chú & Chỉ dẫn</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <textarea
                                        rows={3}
                                        placeholder="Mô tả chi tiết công việc hoặc lưu ý cho người thực hiện..."
                                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400 min-h-[100px]"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Đính kèm</label>
                                    <button
                                        type="button"
                                        onClick={handleAddLink}
                                        className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Thêm Link
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {/* Links */}
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {formData.links.map((link, index) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ duration: 0.2 }}
                                                key={`link-${index}`}
                                                className="flex gap-2"
                                            >
                                                <div className="relative flex-1 group">
                                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    <input
                                                        type="url"
                                                        placeholder="Nhập link tài liệu (Google Drive, Dropbox...)"
                                                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all text-slate-600 font-medium"
                                                        value={link}
                                                        onChange={(e) => handleLinkChange(index, e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLink(index)}
                                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Files */}
                                    <div
                                        className="relative overflow-hidden border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center bg-slate-50/30 hover:bg-blue-50/30 hover:border-blue-300 transition-all cursor-pointer group"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 group-hover:shadow-blue-100 transition-all">
                                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600">Thêm tệp đính kèm</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium italic">Kéo thả hoặc bấm để chọn tệp (Tối đa 5 file, 25MB)</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            multiple
                                            onChange={handleFileChange}
                                        />
                                    </div>

                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {files.length > 0 && (
                                            <div className="grid grid-cols-1 gap-2">
                                                {files.map((file, index) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{ duration: 0.2 }}
                                                        key={`file-${file.name}-${index}`}
                                                        className="flex items-center justify-between p-4 bg-white border-2 border-slate-50 rounded-2xl hover:border-blue-100 transition-all shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-4 transition-all">
                                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-slate-700 truncate max-w-[240px]">{file.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveFile(index);
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-all hover:rotate-12"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
                            >
                                Hủy bỏ
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isAssigning}
                                className="flex-[1.5] px-6 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:shadow-none"
                            >
                                {isAssigning ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Đang xử lý</span>
                                    </>
                                ) : (
                                    <span>Xác nhận phân công</span>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const Briefcase = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
