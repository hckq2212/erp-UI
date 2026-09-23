import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Plus, Wallet, RefreshCw } from 'lucide-react';
import {
    useGetPaymentRequestsQuery,
    useGetPaymentRequestQuery,
    useGetPaymentRequestsTotalDebtQuery,
    useCreatePaymentRequestMutation,
} from '../../api/paymentRequests';
import { useGetProjectsQuery } from '../../api/projects';
import { useGetMeQuery } from '../../api/auth';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';
import { PaymentRequestFormModal } from '../../components/paymentRequests/PaymentRequestFormModal';
import { PaymentRequestDetailModal } from '../../components/paymentRequests/PaymentRequestDetailModal';

const TYPE_LABELS = {
    PROJECT: 'Theo dự án',
    OTHER_WORK: 'Công việc khác',
    VENDOR_EXPENSE: 'Chi phí phát sinh (Vendor)',
};

const APPROVAL_LABELS = {
    DRAFT: 'Nháp',
    PENDING_REVIEWER: 'Chờ Admin Sale duyệt',
    NEED_MORE_DOCS: 'Yêu cầu bổ sung',
    PENDING_BOD: 'Chờ BOD xác nhận',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
};

const PAYMENT_LABELS = {
    WAITING: 'Chờ thanh toán',
    DUE_SOON: 'Sắp hết hạn',
    OVERDUE: 'Hết hạn',
    PAID: 'Đã thanh toán',
};

const PAYMENT_BADGE_CLASS = {
    WAITING: 'bg-slate-100 text-slate-700',
    DUE_SOON: 'bg-amber-100 text-amber-700',
    OVERDUE: 'bg-red-100 text-red-700',
    PAID: 'bg-emerald-100 text-emerald-700',
};

const APPROVAL_BADGE_CLASS = {
    DRAFT: 'bg-slate-100 text-slate-600',
    PENDING_REVIEWER: 'bg-blue-100 text-blue-700',
    NEED_MORE_DOCS: 'bg-orange-100 text-orange-700',
    PENDING_BOD: 'bg-purple-100 text-purple-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
};

export const PaymentRequestsPage = () => {
    const navigate = useNavigate();
    const { id: idParam } = useParams();
    // Nguồn sự thật cho request đang mở là URL (/payment-requests/:id), không phải state
    // cục bộ, để link thông báo redirect đúng trang và F5/điều hướng giữa các thông báo
    // luôn load lại đúng yêu cầu thanh toán tương ứng.
    const selectedId = idParam ? Number(idParam) : null;

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [approvalFilter, setApprovalFilter] = useState('ALL');
    const [paymentFilter, setPaymentFilter] = useState('ALL');
    const [projectFilter, setProjectFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [showForm, setShowForm] = useState(false);

    const { data: me } = useGetMeQuery();

    const queryParams = useMemo(() => {
        const params = { sortBy, sortOrder };
        if (search.trim()) params.search = search.trim();
        if (typeFilter !== 'ALL') params.type = typeFilter;
        if (approvalFilter !== 'ALL') params.approvalStatus = approvalFilter;
        if (paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;
        if (projectFilter !== 'ALL') params.projectId = projectFilter;
        return params;
    }, [search, typeFilter, approvalFilter, paymentFilter, projectFilter, sortBy, sortOrder]);

    const { data: requests = [], isLoading, isFetching, refetch } = useGetPaymentRequestsQuery(queryParams);
    const { data: totalDebtData } = useGetPaymentRequestsTotalDebtQuery({});
    // Fetch riêng yêu cầu đang được chọn theo id trên URL: đảm bảo modal luôn hiển thị
    // đúng dữ liệu mới nhất kể cả khi request đó không nằm trong danh sách đã lọc/phân trang
    // hiện tại (ví dụ bấm vào thông báo của một yêu cầu đang bị filter ẩn đi, hoặc load lại trang).
    const { data: fetchedSelectedRequest } = useGetPaymentRequestQuery(selectedId, { skip: !selectedId });
    const { data: projectsResponse } = useGetProjectsQuery();
    const projects = projectsResponse?.data || [];

    const [createPaymentRequest, { isLoading: isCreating }] = useCreatePaymentRequestMutation();

    const projectNameById = useMemo(() => {
        const map = new Map();
        projects.forEach((p) => map.set(String(p.id), p.name));
        return map;
    }, [projects]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(column);
            setSortOrder('DESC');
        }
    };

    const handleCreate = async (payload) => {
        await createPaymentRequest(payload).unwrap();
        setShowForm(false);
    };

    const selectedRequest = requests.find((r) => r.id === selectedId) || fetchedSelectedRequest || null;

    return (
        <div className='p-6 space-y-6'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold text-slate-800'>Yêu cầu thanh toán</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
                >
                    <Plus size={18} />
                    Tạo yêu cầu
                </button>
            </div>

            <div className='rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600'>
                    <Wallet size={22} />
                </div>
                <div>
                    <p className='text-sm text-slate-500'>Tổng nợ (đã duyệt, chưa thanh toán)</p>
                    <p className='text-xl font-semibold text-slate-800'>
                        {formatCurrency(totalDebtData?.totalDebt || 0)}
                    </p>
                </div>
                <button
                    onClick={refetch}
                    className='ml-auto flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800'
                >
                    <RefreshCw size={16} className={cn(isFetching && 'animate-spin')} />
                    Làm mới
                </button>
            </div>

            <div className='rounded-xl border border-slate-200 bg-white p-4 space-y-3'>
                <div className='relative'>
                    <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Tìm theo nội dung...'
                        className='w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none'
                    />
                </div>

                <div className='flex flex-wrap gap-3'>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className='rounded-lg border border-slate-200 px-3 py-2 text-sm'>
                        <option value='ALL'>Tất cả loại</option>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>

                    <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} className='rounded-lg border border-slate-200 px-3 py-2 text-sm'>
                        <option value='ALL'>Tất cả trạng thái duyệt</option>
                        {Object.entries(APPROVAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>

                    <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className='rounded-lg border border-slate-200 px-3 py-2 text-sm'>
                        <option value='ALL'>Tất cả trạng thái thanh toán</option>
                        {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>

                    <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className='rounded-lg border border-slate-200 px-3 py-2 text-sm'>
                        <option value='ALL'>Tất cả dự án</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div className='overflow-x-auto rounded-xl border border-slate-200 bg-white'>
                <table className='min-w-full text-sm'>
                    <thead className='bg-slate-50 text-left text-slate-500'>
                        <tr>
                            <th className='px-4 py-3'>Nội dung</th>
                            <th className='px-4 py-3'>Loại</th>
                            <th className='px-4 py-3'>Dự án</th>
                            <th className='px-4 py-3 cursor-pointer select-none' onClick={() => handleSort('amount')}>
                                Số tiền {sortBy === 'amount' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}
                            </th>
                            <th className='px-4 py-3 cursor-pointer select-none' onClick={() => handleSort('dueDate')}>
                                Hạn thanh toán {sortBy === 'dueDate' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}
                            </th>
                            <th className='px-4 py-3'>Duyệt</th>
                            <th className='px-4 py-3'>Thanh toán</th>
                            <th className='px-4 py-3 cursor-pointer select-none' onClick={() => handleSort('createdAt')}>
                                Ngày tạo {sortBy === 'createdAt' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}
                            </th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {isLoading && (
                            <tr><td colSpan={8} className='px-4 py-8 text-center text-slate-400'>Đang tải...</td></tr>
                        )}
                        {!isLoading && requests.length === 0 && (
                            <tr><td colSpan={8} className='px-4 py-8 text-center text-slate-400'>Không có yêu cầu thanh toán nào</td></tr>
                        )}
                        {requests.map((r) => (
                            <tr key={r.id} onClick={() => navigate(`/payment-requests/${r.id}`)} className='cursor-pointer hover:bg-slate-50'>
                                <td className='px-4 py-3 max-w-xs truncate'>{r.content}</td>
                                <td className='px-4 py-3'>{TYPE_LABELS[r.type] || r.type}</td>
                                <td className='px-4 py-3'>{r.project?.name || projectNameById.get(String(r.projectId)) || '-'}</td>
                                <td className='px-4 py-3 font-medium'>{formatCurrency(r.amount)}</td>
                                <td className='px-4 py-3'>{r.confirmedDueDate || r.dueDate}</td>
                                <td className='px-4 py-3'>
                                    <span className={cn('rounded-full px-2 py-1 text-xs font-medium', APPROVAL_BADGE_CLASS[r.approvalStatus])}>
                                        {APPROVAL_LABELS[r.approvalStatus] || r.approvalStatus}
                                    </span>
                                </td>
                                <td className='px-4 py-3'>
                                    <span className={cn('rounded-full px-2 py-1 text-xs font-medium', PAYMENT_BADGE_CLASS[r.paymentStatus])}>
                                        {PAYMENT_LABELS[r.paymentStatus] || r.paymentStatus}
                                    </span>
                                </td>
                                <td className='px-4 py-3 text-slate-500'>{r.createdAt?.slice(0, 10)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <PaymentRequestFormModal
                    projects={projects}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleCreate}
                    isSubmitting={isCreating}
                    currentUserId={me?.userId || me?.id}
                />
            )}

            {selectedRequest && (
                <PaymentRequestDetailModal
                    request={selectedRequest}
                    currentUserRole={me?.role}
                    currentUserId={me?.userId || me?.id}
                    onClose={() => navigate('/payment-requests')}
                />
            )}
        </div>
    );
};
