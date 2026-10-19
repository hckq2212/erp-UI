import { useParams, useNavigate } from 'react-router-dom';
import { useGetJobQuery } from '../../api/jobs';
import { useGetMeQuery } from '../../api/auth';
import {
    Briefcase,
    Code,
    DollarSign,
    Users,
    ClipboardCheck,
    Truck,
    Layers,
    ArrowLeft,
    CheckCircle2,
    Building2,
    Calendar,
    ExternalLink,
    Pencil,
    Clock,
    FileText,
    Link2

} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import {
    JOB_CATEGORY_LABELS,
    JOB_CATEGORY_COLORS,
    JOB_LEVEL_LABELS,
    JOB_LEVEL_COLORS,
    JOB_RESPONSIBLE_ROLE_LABELS,
    JOB_RESPONSIBLE_ROLE_COLORS
} from '../../utils/enums';
import { cn } from '../../utils/cn';
import { useState } from 'react';
import { EditJobCriteriaModal } from './EditJobCriteriaModal';
import { EditJobInfoModal } from './EditJobInfoModal';

export const JobDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: job, isLoading, error } = useGetJobQuery(id);
    const { data: me } = useGetMeQuery();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);

    const canEdit = me?.role === 'ADMIN' || me?.role === 'BOD';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 font-medium">Không tìm thấy thông tin hạng mục</p>
                <Button onClick={() => navigate('/jobs')} variant="ghost" className="mt-4">
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Navigation & Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => navigate('/jobs')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors w-fit"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">{job.name}</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100">
                                {job.code}
                            </span>
                            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border", JOB_LEVEL_COLORS[job.level || 'A'] || 'bg-gray-100 text-gray-600 border-gray-200')}>
                                Level {JOB_LEVEL_LABELS[job.level || 'A'] || job.level || 'A'}
                            </span>
                            {job.responsibleRole && (
                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border", JOB_RESPONSIBLE_ROLE_COLORS[job.responsibleRole] || 'bg-gray-100 text-gray-600 border-gray-200')}>
                                    Phụ trách {JOB_RESPONSIBLE_ROLE_LABELS[job.responsibleRole] || job.responsibleRole}
                                </span>
                            )}
                        </div>
                        {job.nickname && (
                            <p className="text-sm font-semibold text-gray-500 mt-1">
                                Nickname mặc định: {job.nickname}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {Array.isArray(job.categories) && job.categories.length > 0 ? (
                                job.categories.map((cat) => (
                                    <span
                                        key={cat}
                                        className={cn("px-2 py-0.5 rounded-lg text-xs font-bold border", JOB_CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600 border-gray-200')}
                                    >
                                        {JOB_CATEGORY_LABELS[cat] || cat}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs italic text-gray-400">Chưa xác định category</span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm mt-1">Quản lý chi tiết và tiêu chí đánh giá hạng mục công việc</p>
                    </div>
                    {canEdit && (
                        <Button
                            onClick={() => setIsEditInfoModalOpen(true)}
                            className="flex items-center gap-2 font-bold"
                        >
                            <Pencil className="w-4 h-4" /> Chỉnh sửa
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Giá vốn mặc định</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(job.costPrice)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vinicoin</p>
                        <p className="text-xl font-bold text-gray-900">{job.vinicoin || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thời gian hoàn thành dự kiến</p>
                        <p className="text-xl font-bold text-gray-900">{job?.timeToComplete || 0} giờ</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/30">
                    <FileText className="w-5 h-5 text-orange-500" />
                    <h2 className="font-bold text-gray-900">Mô tả công việc</h2>
                </div>
                <div className="p-6 space-y-4">
                    {job.description ? (
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Chưa có mô tả công việc.</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
                        <Link2 className="w-4 h-4 text-blue-500" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tài liệu mẫu:</span>
                        {job.sampleDocumentUrl ? (
                            <a
                                href={job.sampleDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-blue-600 hover:underline break-all"
                            >
                                {job.sampleDocumentUrl}
                            </a>
                        ) : (
                            <span className="text-sm text-gray-400 italic">Chưa có tài liệu mẫu</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Criteria & Services */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Evaluation Criteria */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div className="flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-orange-500" />
                                <h2 className="font-bold text-gray-900">Tiêu chí đánh giá chất lượng</h2>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(true)}
                                className="h-8 text-xs font-bold flex items-center gap-1.5"
                            >
                                <Pencil className="w-3 h-3" /> Chỉnh sửa
                            </Button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {job.criteria?.map((item) => (
                                    <div key={item.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-green-500 border border-green-50 group-hover:scale-110 transition-transform">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">{item.name}</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-200/50 pt-2 mt-2 italic">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {(!job.criteria || job.criteria.length === 0) && (
                                    <div className="col-span-full py-8 text-center text-gray-400 italic text-sm border border-dashed border-gray-200 rounded-xl">
                                        Chưa có tiêu chí đánh giá nào được thiết lập.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Associated Services */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/30">
                            <Layers className="w-5 h-5 text-blue-500" />
                            <h2 className="font-bold text-gray-900">Dịch vụ sử dụng hạng mục này</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Tên dịch vụ</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Giá vốn</th>
                                        <th className="px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {job.services?.map((service) => (
                                        <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{service.name}</p>
                                                {service.description && (
                                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{service.description}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {formatCurrency(service.costPrice)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/services/${service.id}`)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!job.services || job.services.length === 0) && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-gray-400 italic text-sm">
                                                Hạng mục này chưa được gán cho dịch vụ nào.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Vendor Offers */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-bold text-gray-900">Vendor cung cấp</h2>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                {job.vendorJobs?.length || 0}
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                            {job.vendorJobs?.map((wj) => (
                                <div key={wj.id} className="p-4 hover:bg-gray-50/50 transition-colors group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-tight line-clamp-1">
                                                    {wj.vendor?.name}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                                    <Truck className="w-3 h-3" />
                                                    <span>{wj.vendor?.type === 'INDIVIDUAL' ? 'Cá nhân' : 'Công ty'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <div className="p-2.5 rounded-xl bg-green-50/50 border border-green-100">
                                            <p className="text-[10px] font-bold text-green-700/60 uppercase tracking-tighter mb-1">Giá chào</p>
                                            <p className="text-sm font-bold text-green-700">{formatCurrency(wj.price)}</p>
                                        </div>
                                        <div className="flex flex-col justify-end items-end p-2.5">
                                            <button
                                                onClick={() => navigate(`/vendors/${wj.vendor?.id}`)}
                                                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                Hồ sơ vendor <ExternalLink className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 border-t border-gray-50 pt-3">
                                        <Calendar className="w-3 h-3" />
                                        <span>Cập nhật: {new Date(wj.updatedAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            ))}
                            {(!job.vendorJobs || job.vendorJobs.length === 0) && (
                                <div className="p-12 text-center">
                                    <Truck className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                    <p className="text-xs text-gray-400 italic">Chưa có vendor nào thực hiện hạng mục này.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <EditJobCriteriaModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                job={job}
            />

            <EditJobInfoModal
                isOpen={isEditInfoModalOpen}
                onClose={() => setIsEditInfoModalOpen(false)}
                job={job}
            />
        </div>
    );
};
