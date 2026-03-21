import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Calendar, User, Users, FileText, Trash2, Plus, Info, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetTeamMembersQuery, useGetTeamsQuery, useLazyGetTeamsQuery, useLazyGetTeamMembersQuery } from '../../../api/teams';
import { useAssignTaskMutation, useAssignSupportTeamMutation, useRequestSupportMutation } from '../../../api/tasks';
import { formatDate, formatDateTimeISO } from '../../../utils/format';
import { useGetVendorsByJobQuery } from '../../../api/vendors';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import { toast } from 'react-toastify';

export const TaskAssignModal = ({ isOpen, onClose, task, project }) => {
    const isSupportMode = task?.isSupportRequested;
    const teamId = project?.team?.id;
    const fileInputRef = useRef(null);

    // Normal members
    const { data: members = [] } = useGetTeamMembersQuery(teamId, { skip: !teamId || isSupportMode });

    // Lazy fetch for support teams
    const [fetchTeams, { data: allTeams = [], isLoading: isLoadingTeams }] = useLazyGetTeamsQuery();

    // Lazy fetch for support members
    const [fetchSupportMembers, { data: supportMembers = [], isLoading: isLoadingSupportMembers }] = useLazyGetTeamMembersQuery();

    const [assignTask, { isLoading: isAssigning }] = useAssignTaskMutation();
    const [assignSupportTeam, { isLoading: isAssigningSupport }] = useAssignSupportTeamMutation();
    const [requestSupport] = useRequestSupportMutation();

    const [formData, setFormData] = useState({
        assigneeId: '',
        performerType: 'INTERNAL',
        description: task?.description || '',
        links: [''],
        selectedTeamId: '',
        isTeamAssignment: false
    });
    const [plannedStartDate, setPlannedStartDate] = useState(formatDateTimeISO(task?.plannedStartDate) || formatDateTimeISO(new Date()));
    const [plannedEndDate, setPlannedEndDate] = useState(formatDateTimeISO(task?.plannedEndDate) || '');

    const jobId = task?.jobId || task?.job?.id;
    const { data: vendorsResult, isLoading: isLoadingVendors } = useGetVendorsByJobQuery(jobId, {
        skip: formData.performerType !== 'VENDOR' || !jobId
    });
    const vendors = Array.isArray(vendorsResult) ? vendorsResult : (vendorsResult?.data || []);
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({}); // { index: progress }
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isSupportMode && task?.supportTeamId) {
            fetchSupportMembers(task.supportTeamId);
        }
    }, [isSupportMode, task?.supportTeamId, fetchSupportMembers]);

    const handleAddLink = useCallback(() => {
        setFormData(prev => ({ ...prev, links: [...prev.links, ''] }));
    }, []);

    const handleRemoveLink = useCallback((index) => {
        setFormData(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index)
        }));
    }, []);

    const handleLinkChange = useCallback((index, value) => {
        setFormData(prev => {
            const newLinks = [...prev.links];
            newLinks[index] = value;
            return { ...prev, links: newLinks };
        });
    }, []);

    const handleFileChange = useCallback((e) => {
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

        setFiles(prev => [...prev, ...selectedFiles]);
    }, [files]);

    const handleRemoveFile = useCallback((index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();

        if (!formData.isTeamAssignment && !formData.assigneeId) {
            toast.error('Vui lòng chọn người thực hiện');
            return;
        }

        if (formData.isTeamAssignment && !formData.selectedTeamId) {
            toast.error('Vui lòng chọn team hỗ trợ');
            return;
        }

        try {
            let attachments = [];

            // 1. Handle Links
            const validLinks = formData.links
                .filter(link => link.trim() !== '')
                .map(url => ({ type: 'LINK', name: url, url }));
            attachments.push(...validLinks);

            // 2. Handle Files (Direct Upload)
            if (files.length > 0) {
                setIsUploading(true);
                const uploadPromises = files.map((file, index) =>
                    uploadToCloudinary(
                        file,
                        'GETVINI/ERP/tasks',
                        (progress) => setUploadProgress(prev => ({ ...prev, [index]: progress }))
                    )
                );

                const uploadedFiles = await Promise.all(uploadPromises);
                attachments.push(...uploadedFiles);
                setIsUploading(false);
            }

            if (formData.isTeamAssignment) {
                // If it's a new support request from DOING task
                if (task.status === 'DOING' && !task.isSupportRequested) {
                    await requestSupport({
                        id: task.id,
                        note: formData.description || "Cần hỗ trợ thực hiện công việc này",
                        projectId: project.id
                    }).unwrap();
                }

                await assignSupportTeam({
                    id: task.id,
                    teamId: formData.selectedTeamId,
                    projectId: project.id
                }).unwrap();
                toast.success('Giao hỗ trợ team thành công');
            } else {
                await assignTask({
                    id: task.id,
                    assigneeId: formData.assigneeId,
                    performerType: formData.performerType,
                    plannedEndDate: plannedEndDate || undefined,
                    plannedStartDate: plannedStartDate || undefined,
                    description: formData.description || undefined,
                    attachments,
                    projectId: project.id
                }).unwrap();
                toast.success('Phân công công việc thành công');
            }
            onClose();
        } catch (err) {
            setIsUploading(false);
            toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi phân công');
        }
    }, [formData, files, task.id, project.id, assignTask, assignSupportTeam, onClose, plannedStartDate, plannedEndDate, requestSupport, task.status, task.isSupportRequested]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60"
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
                        style={{ backfaceVisibility: 'hidden', willChange: "transform, opacity" }}
                        className="bg-white rounded-[32px] w-full max-w-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden relative transform-gpu"
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

                        <div
                            className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 overscroll-contain"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                willChange: 'scroll-position',
                                transform: 'translateZ(0)'
                            }}
                        >
                            {/* Performer Type Selector */}
                            {!formData.isTeamAssignment && (
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
                            )}

                            {/* Assignee Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        {formData.isTeamAssignment ? 'Team hỗ trợ' : (formData.performerType === 'INTERNAL' ? 'Người thực hiện' : 'Đối tác Vendor')}
                                    </label>
                                    {(isSupportMode || (task?.status === 'DOING' && !task?.isSupportRequested)) && (
                                        <label className="flex items-center gap-2 cursor-pointer group/check">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    id="support-request-checkbox"
                                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-300"
                                                    checked={formData.isTeamAssignment}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        setFormData({
                                                            ...formData,
                                                            isTeamAssignment: isChecked,
                                                            assigneeId: '',
                                                            selectedTeamId: ''
                                                        });
                                                        if (isChecked) fetchTeams();
                                                    }}
                                                />
                                                <svg className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider group-hover/check:text-blue-700 transition-colors">
                                                Nhờ hỗ trợ từ team khác
                                            </span>
                                        </label>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                        {formData.isTeamAssignment ? <Users className="w-full h-full" /> : <User className="w-full h-full" />}
                                    </div>
                                    <select
                                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-slate-700 font-medium"
                                        value={formData.isTeamAssignment ? formData.selectedTeamId : formData.assigneeId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (formData.isTeamAssignment) {
                                                setFormData({ ...formData, selectedTeamId: val });
                                                if (val) fetchSupportMembers(val);
                                            } else {
                                                setFormData({ ...formData, assigneeId: val });
                                            }
                                        }}
                                        onFocus={() => {
                                            if (formData.isTeamAssignment && allTeams.length === 0) fetchTeams();
                                        }}
                                    >
                                        <option value="">
                                            {formData.isTeamAssignment
                                                ? (isLoadingTeams ? 'Đang tải danh sách team...' : 'Chọn team hỗ trợ')
                                                : (formData.performerType === 'VENDOR' && isLoadingVendors
                                                    ? 'Đang tải danh sách...'
                                                    : `Chọn ${formData.performerType === 'INTERNAL' ? 'người thực hiện' : 'vendor'}`)}
                                        </option>
                                        {formData.isTeamAssignment ? (
                                            allTeams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} (Lead: {t.teamLead?.fullName})</option>
                                            ))
                                        ) : (
                                            formData.performerType === 'INTERNAL' ? (
                                                (isSupportMode && task.supportTeamId ? supportMembers : members).map(m => (
                                                    <option key={m.user.id} value={m.user.id}>{m.user.fullName}</option>
                                                ))
                                            ) : (
                                                vendors.map(v => (
                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                ))
                                            )
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
                                            type="datetime-local"
                                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                                            value={plannedStartDate}
                                            onChange={(e) => setPlannedStartDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Deadline</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="datetime-local"
                                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                                            value={plannedEndDate}
                                            onChange={(e) => setPlannedEndDate(e.target.value)}
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
                                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-bold text-slate-700 truncate max-w-[240px]">{file.name}</p>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                                    {isUploading && uploadProgress[index] !== undefined && (
                                                                        <div className="flex-1 max-w-[100px] h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="bg-blue-600 h-full transition-all duration-300"
                                                                                style={{ width: `${uploadProgress[index]}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveFile(index);
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-all hover:rotate-12"
                                                            disabled={isUploading}
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
                                onClick={handleSubmit}
                                disabled={isAssigning || isUploading}
                                className="flex-[1.5] px-6 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:shadow-none"
                            >
                                {isAssigning || isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Đang xử lý</span>
                                    </>
                                ) : (
                                    <span>Xác nhận phân công</span>
                                )}
                            </motion.button>
                        </div>
                    </motion.div >
                </div >
            )}
        </AnimatePresence >
    );
};

