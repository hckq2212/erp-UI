import { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Calendar, User, FileText, Trash2, Plus } from 'lucide-react';
import { useGetTeamMembersQuery } from '../../../api/teams';
import { useAssignTaskMutation } from '../../../api/tasks';
import { toast } from 'react-toastify';

export const TaskAssignModal = ({ isOpen, onClose, task, project }) => {
    const teamId = project?.team?.id;
    const { data: members = [] } = useGetTeamMembersQuery(teamId, { skip: !teamId });
    const [assignTask, { isLoading: isAssigning }] = useAssignTaskMutation();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        assigneeId: '',
        plannedEndDate: '',
        plannedStartDate:'',
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

        // Check size < 25MB
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
        if (!formData.assigneeId) {
            toast.error('Vui lòng chọn người thực hiện');
            return;
        }

        try {
            const data = new FormData();
            data.append('assigneeId', formData.assigneeId);
            if (formData.plannedEndDate) {
                data.append('plannedEndDate', formData.plannedEndDate);
            }
            if (formData.plannedStartDate) {
                data.append('plannedStartDate', formData.plannedStartDate);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 uppercase">Phân công công việc</h3>
                            <p className="text-sm text-gray-500 font-mono">{task.code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    {/* Assignee */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Người thực hiện</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={formData.assigneeId}
                                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                            >
                                <option value="">Chọn người thực hiện</option>
                                {members.map(m => (
                                    <option key={m.user.id} value={m.user.id}>{m.user.fullName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Planned Start Date */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Ngày bắt đầu</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={formData.plannedStartDate}
                                onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Planned End Date */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Deadline</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={formData.plannedEndDate}
                                onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
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
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLink(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Tài liệu đính kèm (Tối đa 5 file, 25MB)</label>
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/50 hover:border-blue-300 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                            <p className="text-sm text-gray-500">Tải tệp lên từ máy tính của bạn</p>
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
                                            <div>
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
                        disabled={isAssigning}
                        className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:bg-blue-300 disabled:shadow-none"
                    >
                        {isAssigning ? 'Đang xử lý...' : 'Xác nhận phân công'}
                    </button>
                </div>
            </div>
        </div>
    );
};
