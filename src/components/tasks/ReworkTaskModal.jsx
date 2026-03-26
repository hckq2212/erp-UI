import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Upload, X, FileText, Calendar, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { toast } from 'react-toastify';
import { cn } from '../../utils/cn';

export const ReworkTaskModal = ({ isOpen, onClose, onSubmit, isLoading, taskName }) => {
    const [feedback, setFeedback] = useState('');
    const [deadlineAt, setDeadlineAt] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [linkInput, setLinkInput] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            const newAttachments = [...attachments];
            for (const file of files) {
                const uploaded = await uploadToCloudinary(
                    file,
                    `GETVINI/ERP/REWORK_FEEDBACK`,
                    (progress) => setUploadProgress(progress)
                );
                newAttachments.push(uploaded);
            }
            setAttachments(newAttachments);
            toast.success('Tải tài liệu lên thành công');
        } catch (error) {
            toast.error('Lỗi khi tải tài liệu lên');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddLink = () => {
        if (!linkInput.trim()) return;

        let url = linkInput.trim();
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        setAttachments([...attachments, { type: 'LINK', name: url, url: url }]);
        setLinkInput('');
        toast.success('Đã thêm link');
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!feedback.trim()) {
            toast.error('Vui lòng nhập phản hồi (Feedback)');
            return;
        }
        if (!deadlineAt) {
            toast.error('Vui lòng chọn hạn chót mới');
            return;
        }

        onSubmit({
            feedback,
            deadlineAt,
            attachments
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Yêu cầu làm lại công việc"
            className="max-w-xl"
        >
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Công việc: {taskName}</h3>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phản hồi / Hướng dẫn chỉnh sửa</label>
                    <textarea
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium min-h-[120px]"
                        placeholder="Nhập chi tiết các phần cần chỉnh sửa hoặc lý do không đạt..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-500">Deadline mới</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="datetime-local"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                            value={deadlineAt}
                            onChange={(e) => setDeadlineAt(e.target.value)}
                            min={(() => {
                                const now = new Date();
                                const offset = now.getTimezoneOffset() * 60000;
                                return new Date(now - offset).toISOString().slice(0, 16);
                            })()}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tài liệu hướng dẫn & Link (Tùy chọn)</label>

                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 group">
                                    {file.type === 'LINK' ? <LinkIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                    <span className="max-w-[150px] truncate">{file.name}</span>
                                    <button onClick={() => removeAttachment(idx)} className="text-blue-400 hover:text-red-500 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* File Upload Area */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50/50 transition-all group disabled:opacity-50"
                        >
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple />
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-1">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-[10px] font-bold text-blue-600">{uploadProgress}%</span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all" />
                                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600">Thêm tập tin</span>
                                </>
                            )}
                        </button>

                        {/* Link Input Area */}
                        <div className="h-24 p-4 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col justify-center gap-2">
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Dán link tại đây..."
                                    className="w-full pl-9 pr-2 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                                />
                            </div>
                            <button
                                onClick={handleAddLink}
                                disabled={!linkInput.trim()}
                                className="w-full py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                                Thêm Link
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-2xl py-4"
                        onClick={onClose}
                        disabled={isLoading || isUploading}
                    >
                        Hủy
                    </Button>
                    <Button
                        className="flex-1 rounded-2xl py-4 shadow-lg shadow-blue-200"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        disabled={isLoading || isUploading || !feedback.trim() || !deadlineAt}
                    >
                        Gửi yêu cầu
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
