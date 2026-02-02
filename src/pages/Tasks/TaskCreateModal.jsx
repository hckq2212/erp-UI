import { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Calendar, User, FileText, Trash2, Plus, Briefcase } from 'lucide-react';
import { useGetJobsQuery } from '../../api/jobs';
import { useGetUsersQuery } from '../../api/users';
import { useGetProjectsQuery } from '../../api/projects';
import { useCreateTaskMutation, useAssignTaskMutation } from '../../api/tasks';
import { toast } from 'react-toastify';

export const TaskCreateModal = ({ isOpen, onClose }) => {
    const { data: jobs = [] } = useGetJobsQuery();
    const { data: users = [] } = useGetUsersQuery();
    const { data: projectsResult = [] } = useGetProjectsQuery();
    const projects = Array.isArray(projectsResult) ? projectsResult : (projectsResult?.data || []);
    const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
    const [assignTask, { isLoading: isAssigning }] = useAssignTaskMutation();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        // projectId: '',
        jobId: '',
        assigneeId: '',
        plannedEndDate: '',
        description: '',
        links: [''],
    });

    const [files, setFiles] = useState([]);

    if (!isOpen) return null;

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
        e.preventDefault();
        // if (!formData.projectId) {
        //     toast.error('Vui lòng chọn dự án');
        //     return;
        // }
        if (!formData.jobId) {
            toast.error('Vui lòng chọn = công việc (Job)');
            return;
        }
        if (!formData.assigneeId) {
            toast.error('Vui lòng chọn người thực hiện');
            return;
        }
        if (!formData.plannedEndDate) {
            toast.error('Vui lòng chọn thời hạn (Deadline)');
            return;
        }

        try {
            // Step 1: Create Task
            const newTask = await createTask({
                // projectId: formData.projectId,
                jobId: formData.jobId,
            }).unwrap();

            // Step 2: Assign Task
            const assignData = new FormData();
            assignData.append('assigneeId', formData.assigneeId);
            assignData.append('performerType', 'INTERNAL'); // Default to internal for this modal

            if (formData.plannedEndDate) {
                assignData.append('plannedEndDate', formData.plannedEndDate);
            }
            if (formData.description) {
                assignData.append('description', formData.description);
            }

            const links = formData.links.filter(link => link.trim() !== '');
            if (links.length > 0) {
                assignData.append('links', JSON.stringify(links.map(url => ({ type: 'LINK', name: url, url }))));
            }

            files.forEach(file => {
                assignData.append('files', file);
            });

            await assignTask({ id: newTask.id, formData: assignData }).unwrap();

            toast.success('Tạo và phân công công việc thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi xử lý');
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
                        <h3 className="text-xl font-bold text-gray-900">TẠO CÔNG VIỆC MỚI</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    {/* Project Selection */}
                    {/* <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Dự án</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            >
                                <option value="">Chọn dự án</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                        </div>
                    </div> */}

                    {/* Job Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Công việc</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.jobId}
                                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                            >
                                <option value="">Chọn loại công việc</option>
                                {jobs.map(job => (
                                    <option key={job.id} value={job.id}>{job.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Assignee Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Người thực hiện</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.assigneeId}
                                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                            >
                                <option value="">Chọn người thực hiện</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.fullName || user.username}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Planned End Date */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Thời hạn (Deadline)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.plannedEndDate}
                                onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Mô tả</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                            <textarea
                                rows="3"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                placeholder="Nhập mô tả công việc..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Links */}
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
                            {formData.links.map((link, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={link}
                                            onChange={(e) => handleLinkChange(index, e.target.value)}
                                        />
                                    </div>
                                    {formData.links.length > 1 && (
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

                    {/* File Upload */}
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
                            <div className="mt-4 space-y-2">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-2xl">
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFile(index);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isCreating || isAssigning}
                        className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:bg-blue-300 disabled:shadow-none"
                    >
                        {isCreating || isAssigning ? 'Đang xử lý...' : 'Tạo công việc'}
                    </button>
                </div>
            </div>
        </div>
    );
};
