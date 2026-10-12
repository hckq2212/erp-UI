import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Search, Plus, Wallet, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown, X, Briefcase, ClipboardList, Calendar, DollarSign, Zap,
} from 'lucide-react';
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
import { PaymentRequestCharts } from '../../components/paymentRequests/PaymentRequestCharts';
import { StatusBadge } from '../../components/paymentRequests/PaymentRequestParts';
import {
    TYPE_LABELS, APPROVAL_LABELS, PAYMENT_LABELS, APPROVAL_TONE, PAYMENT_TONE,
    fmtDate, inputCls, btnPrimary,
} from '../../components/paymentRequests/paymentRequestConfig';

// Các vai trò xem được toàn bộ yêu cầu thanh toán (khớp FULL_VISIBILITY_ROLES ở backend) —
// chỉ nhóm này mới có đủ dữ liệu tổng quan để biểu đồ có ý nghĩa.
const CHART_VISIBLE_ROLES = ['ADMIN_SALE', 'BOD', 'ADMIN'];

const TYPE_TABS = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PROJECT', label: 'Theo dự án' },
    { value: 'OTHER_WORK', label: 'Công việc khác' },
];

const selectCls = cn(inputCls, 'w-auto min-w-[10rem] py-2');

const SortHeader = ({ column, label, sortBy, sortOrder, onSort, className }) => {
    const active = sortBy === column;
    const Icon = !active ? ArrowUpDown : sortOrder === 'ASC' ? ArrowUp : ArrowDown;
    return (
        <th className={cn('px-4 py-3 font-medium', className)}>
            <button
                type='button'
                onClick={() => onSort(column)}
                className={cn('inline-flex items-center gap-1 transition hover:text-orange-600', active && 'text-orange-600')}
            >
                {label}
                <Icon size={13} className={active ? '' : 'opacity-40'} />
            </button>
        </th>
    );
};

export const PaymentRequestsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: idParam } = useParams();
    // Nguồn sự thật cho request đang mở là URL (/payment-requests/:id), không phải state
    // cục bộ, để link thông báo redirect đúng trang và F5/điều hướng giữa các thông báo
    // luôn load lại đúng yêu cầu thanh toán tương ứng.
    const selectedId = idParam || null;

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [approvalFilter, setApprovalFilter] = useState('ALL');
    const [paymentFilter, setPaymentFilter] = useState('ALL');
    const [projectFilter, setProjectFilter] = useState('ALL');
    const [dateField, setDateField] = useState('dueDate');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
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
        if (dateField) params.dateField = dateField;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        if (minAmount) params.minAmount = minAmount;
        if (maxAmount) params.maxAmount = maxAmount;
        return params;
    }, [search, typeFilter, approvalFilter, paymentFilter, projectFilter, dateField, fromDate, toDate, minAmount, maxAmount, sortBy, sortOrder]);

    const { data: requests = [], isLoading, isFetching, refetch } = useGetPaymentRequestsQuery(queryParams, { refetchOnMountOrArgChange: true });
    // Danh sách không phụ thuộc bộ lọc, dùng cho thẻ tổng hợp phía trên.
    const { data: allRequests = [], refetch: refetchAll } = useGetPaymentRequestsQuery({}, { refetchOnMountOrArgChange: true });
    const { data: totalDebtData, refetch: refetchDebt } = useGetPaymentRequestsTotalDebtQuery(queryParams, { refetchOnMountOrArgChange: true });
    // Fetch riêng yêu cầu đang được chọn theo id trên URL: đảm bảo modal luôn hiển thị
    // đúng dữ liệu mới nhất kể cả khi request đó không nằm trong danh sách đã lọc hiện tại.
    const { data: fetchedSelected, isError: isSelectedError, refetch: refetchSelected } = useGetPaymentRequestQuery(selectedId, {
        skip: !selectedId,
        refetchOnMountOrArgChange: true,
    });
    const { data: projectsResponse } = useGetProjectsQuery({ limit: 1000 });
    const projects = projectsResponse?.data || [];

    const [createPaymentRequest, { isLoading: isCreating }] = useCreatePaymentRequestMutation();

    const projectNameById = useMemo(() => {
        const map = new Map();
        projects.forEach((p) => map.set(String(p.id), p.name));
        return map;
    }, [projects]);

    const myId = me?.userId || me?.id;
    const canSeeCharts = CHART_VISIBLE_ROLES.includes(me?.role);

    // Yêu cầu của chính người dùng đang chờ họ xử lý: nháp cần gửi duyệt / bị yêu cầu bổ sung.
    const needsMyAction = useCallback(
        (r) => Boolean(myId) && r.requesterId === myId && ['DRAFT', 'NEED_MORE_DOCS'].includes(r.approvalStatus),
        [myId]
    );

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

    // Bấm popup/thông báo -> navigate tới /payment-requests/:id. Mỗi lần điều hướng (kể cả bấm lại đúng
    // link đang mở, khi id không đổi nên RTK Query không tự tải lại) đều nạp lại state từ server.
    const prevNav = useRef({ key: location.key, id: selectedId });
    useEffect(() => {
        const prev = prevNav.current;
        if (prev.key === location.key) return;
        prevNav.current = { key: location.key, id: selectedId };
        refetch();
        refetchAll();
        refetchDebt();
        // id đổi thì query mới tự tải (refetchOnMountOrArgChange); id giữ nguyên thì phải refetch thủ công.
        if (selectedId && prev.id === selectedId) refetchSelected();
    }, [location.key, selectedId, refetch, refetchAll, refetchDebt, refetchSelected]);

    const closeDetail = useCallback(() => navigate('/payment-requests'), [navigate]);

    // Chỉ hiển thị modal khi URL có id. Ưu tiên bản fetch riêng (đầy đủ quan hệ, mới nhất),
    // tạm dùng bản trong danh sách để mở tức thì trong lúc chờ tải.
    const selectedRequest = selectedId
        ? (fetchedSelected?.id === selectedId ? fetchedSelected : requests.find((r) => r.id === selectedId)) || null
        : null;

    // Link cũ/đã bị xóa/không có quyền: không để người dùng đứng ở URL "chết" không có modal.
    useEffect(() => {
        if (selectedId && isSelectedError && !selectedRequest) {
            navigate('/payment-requests', { replace: true });
        }
    }, [selectedId, isSelectedError, selectedRequest, navigate]);

    const hasActiveFilter =
        search.trim() || typeFilter !== 'ALL' || approvalFilter !== 'ALL' || paymentFilter !== 'ALL' || projectFilter !== 'ALL' || fromDate || toDate || minAmount || maxAmount;

    const resetFilters = () => {
        setSearch('');
        setTypeFilter('ALL');
        setApprovalFilter('ALL');
        setPaymentFilter('ALL');
        setProjectFilter('ALL');
        setDateField('dueDate');
        setFromDate('');
        setToDate('');
        setMinAmount('');
        setMaxAmount('');
    };

    return (
        <div className='-mx-8 -mb-8 min-h-[calc(100vh-4rem)] space-y-5 bg-orange-50/40 px-8 py-6'>
            {/* Tiêu đề */}
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                    <h1 className='text-2xl font-bold text-stone-800'>Yêu cầu thanh toán</h1>
                    <p className='mt-0.5 text-sm text-stone-500'>Theo dõi, duyệt và chi tiền cho các khoản chi phí phát sinh</p>
                </div>
                <button onClick={() => setShowForm(true)} className={btnPrimary}>
                    <Plus size={18} />
                    Tạo yêu cầu
                </button>
            </div>

            {/* 3 Thẻ chỉ số tổng nợ (Dynamic & Tương tác) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                <button
                    type='button'
                    onClick={() => setTypeFilter('ALL')}
                    className={cn(
                        'flex items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md',
                        typeFilter === 'ALL'
                            ? 'border-orange-400 ring-2 ring-orange-200'
                            : 'border-orange-100 hover:border-orange-300'
                    )}
                >
                    <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600'>
                        <Wallet size={22} />
                    </div>
                    <div className='min-w-0 flex-1'>
                        <p className='text-xs font-semibold uppercase tracking-wider text-stone-500'>Tổng nợ (Tất cả)</p>
                        <p className='truncate text-xl font-bold text-stone-800 sm:text-2xl'>
                            {formatCurrency(totalDebtData?.totalDebt || 0) || '0 VNĐ'}
                        </p>
                        <p className='text-[11px] text-stone-400'>Đã duyệt, chưa thanh toán</p>
                    </div>
                </button>

                <button
                    type='button'
                    onClick={() => setTypeFilter('PROJECT')}
                    className={cn(
                        'flex items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md',
                        typeFilter === 'PROJECT'
                            ? 'border-blue-400 ring-2 ring-blue-200'
                            : 'border-stone-100 hover:border-blue-300'
                    )}
                >
                    <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600'>
                        <Briefcase size={22} />
                    </div>
                    <div className='min-w-0 flex-1'>
                        <p className='text-xs font-semibold uppercase tracking-wider text-stone-500'>Nợ theo dự án</p>
                        <p className='truncate text-xl font-bold text-blue-700 sm:text-2xl'>
                            {formatCurrency(totalDebtData?.projectDebt || 0) || '0 VNĐ'}
                        </p>
                        <p className='text-[11px] text-stone-400'>Thuộc loại dự án</p>
                    </div>
                </button>

                <button
                    type='button'
                    onClick={() => setTypeFilter('OTHER_WORK')}
                    className={cn(
                        'flex items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md',
                        typeFilter === 'OTHER_WORK'
                            ? 'border-emerald-400 ring-2 ring-emerald-200'
                            : 'border-stone-100 hover:border-emerald-300'
                    )}
                >
                    <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600'>
                        <ClipboardList size={22} />
                    </div>
                    <div className='min-w-0 flex-1'>
                        <p className='text-xs font-semibold uppercase tracking-wider text-stone-500'>Nợ công việc khác</p>
                        <p className='truncate text-xl font-bold text-emerald-700 sm:text-2xl'>
                            {formatCurrency(totalDebtData?.otherWorkDebt || 0) || '0 VNĐ'}
                        </p>
                        <p className='text-[11px] text-stone-400'>Công việc độc lập</p>
                    </div>
                </button>
            </div>

            {/* Biểu đồ tổng quan: chỉ dành cho Admin Sale/BOD/Admin — các vai trò xem toàn bộ yêu cầu */}
            {canSeeCharts && <PaymentRequestCharts requests={allRequests} projectNameById={projectNameById} />}

            {/* Bộ lọc */}
            <div className='space-y-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm'>
                <div className='flex flex-wrap items-center gap-3'>
                    <div className='relative min-w-[16rem] flex-1'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-stone-400' />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Tìm theo nội dung...'
                            className={cn(inputCls, 'pl-9')}
                        />
                    </div>
                    <button
                        type='button'
                        onClick={refetch}
                        className='inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-500 transition hover:bg-orange-50 hover:text-orange-700'
                    >
                        <RefreshCw size={15} className={cn(isFetching && 'animate-spin')} />
                        Làm mới
                    </button>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                    {TYPE_TABS.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            type='button'
                            onClick={() => setTypeFilter(value)}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                                typeFilter === value
                                    ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                                    : 'border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-700'
                            )}
                        >
                            {Icon && <Icon size={14} />}
                            {label}
                        </button>
                    ))}
                </div>

                <div className='flex flex-wrap items-center gap-3'>
                    <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} className={selectCls}>
                        <option value='ALL'>Tất cả trạng thái duyệt</option>
                        {Object.entries(APPROVAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>

                    <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={selectCls}>
                        <option value='ALL'>Tất cả trạng thái thanh toán</option>
                        {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>

                    <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className={selectCls}>
                        <option value='ALL'>Tất cả dự án</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    {hasActiveFilter && (
                        <button
                            type='button'
                            onClick={resetFilters}
                            className='inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700'
                        >
                            <X size={14} /> Xóa bộ lọc
                        </button>
                    )}
                </div>

                {/* Hàng filter bổ sung: Thời gian & Số tiền */}
                <div className='flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3 text-xs'>
                    {/* Filter theo Thời gian */}
                    <div className='flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50/50 p-1.5'>
                        <div className='flex items-center gap-1 font-medium text-stone-600 px-1'>
                            <Calendar size={13} className='text-orange-500' />
                            <span>Thời gian:</span>
                        </div>
                        <select
                            value={dateField}
                            onChange={(e) => setDateField(e.target.value)}
                            className='rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 outline-none focus:border-orange-400'
                        >
                            <option value='dueDate'>Hạn thanh toán</option>
                            <option value='createdAt'>Ngày tạo</option>
                        </select>
                        <input
                            type='date'
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className='rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 outline-none focus:border-orange-400'
                        />
                        <span className='text-stone-400'>-</span>
                        <input
                            type='date'
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className='rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 outline-none focus:border-orange-400'
                        />
                    </div>

                    {/* Filter theo Số tiền */}
                    <div className='flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50/50 p-1.5'>
                        <div className='flex items-center gap-1 font-medium text-stone-600 px-1'>
                            <DollarSign size={13} className='text-orange-500' />
                            <span>Số tiền (VNĐ):</span>
                        </div>
                        <input
                            type='number'
                            placeholder='Từ'
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            className='w-28 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 outline-none focus:border-orange-400'
                        />
                        <span className='text-stone-400'>-</span>
                        <input
                            type='number'
                            placeholder='Đến'
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            className='w-28 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 outline-none focus:border-orange-400'
                        />
                    </div>
                </div>
            </div>

            {/* Bảng */}
            <div className='overflow-x-auto rounded-2xl border border-orange-100 bg-white shadow-sm'>
                <table className='min-w-full text-sm'>
                    <thead className='bg-orange-50/70 text-left text-xs uppercase tracking-wide text-stone-500'>
                        <tr>
                            <th className='border-l-4 border-transparent px-4 py-3 font-medium'>Nội dung</th>
                            <th className='px-4 py-3 font-medium'>Dự án</th>
                            <SortHeader column='amount' label='Số tiền' {...{ sortBy, sortOrder }} onSort={handleSort} />
                            <SortHeader column='dueDate' label='Hạn thanh toán' {...{ sortBy, sortOrder }} onSort={handleSort} />
                            <th className='px-4 py-3 font-medium'>Duyệt</th>
                            <th className='px-4 py-3 font-medium'>Thanh toán</th>
                            <SortHeader column='createdAt' label='Ngày tạo' {...{ sortBy, sortOrder }} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-stone-100'>
                        {isLoading && (
                            <tr><td colSpan={7} className='px-4 py-10 text-center text-stone-400'>Đang tải...</td></tr>
                        )}
                        {!isLoading && requests.length === 0 && (
                            <tr>
                                <td colSpan={7} className='px-4 py-12 text-center'>
                                    <Wallet size={28} className='mx-auto mb-2 text-orange-200' />
                                    <p className='text-stone-500'>Không có yêu cầu thanh toán nào</p>
                                </td>
                            </tr>
                        )}
                        {requests.map((r) => {
                            const highlight = needsMyAction(r);
                            const vendorName = r.vendor?.name;
                            const taskName = r.task?.name;
                            return (
                                <tr
                                    key={r.id}
                                    tabIndex={0}
                                    onClick={() => navigate(`/payment-requests/${r.id}`)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/payment-requests/${r.id}`); }}
                                    className={cn(
                                        'cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300',
                                        highlight ? 'bg-orange-50/80 hover:bg-orange-100/70' : 'hover:bg-orange-50/40'
                                    )}
                                >
                                    <td className={cn('max-w-sm border-l-4 px-4 py-3', highlight ? 'border-orange-500' : 'border-transparent')}>
                                        <div className='flex flex-wrap items-center gap-1 mb-1'>
                                            {highlight && (
                                                <span className='inline-block rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-orange-600 ring-1 ring-orange-300'>
                                                    {r.approvalStatus === 'DRAFT' ? 'Cần gửi duyệt' : 'Cần bổ sung'}
                                                </span>
                                            )}
                                            {r.isUrgent && (
                                                <span className='inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-300'>
                                                    <Zap size={11} className='fill-amber-600 text-amber-600' /> GẤP
                                                </span>
                                            )}
                                        </div>
                                        <p className='line-clamp-2 font-medium text-stone-800'>{r.content}</p>
                                        <p className='mt-0.5 truncate text-xs text-stone-500'>
                                            {[
                                                TYPE_LABELS[r.type] || r.type,
                                                vendorName && `Vendor: ${vendorName}`,
                                                taskName && `Việc: ${taskName}`
                                            ].filter(Boolean).join(' · ')}
                                        </p>
                                    </td>
                                    <td className='px-4 py-3 text-stone-600'>
                                        {r.project?.name || projectNameById.get(String(r.projectId)) || '-'}
                                    </td>
                                    <td className={cn('whitespace-nowrap px-4 py-3 font-semibold', highlight ? 'text-orange-700' : 'text-stone-800')}>
                                        {formatCurrency(r.amount)}
                                    </td>
                                    <td className={cn('whitespace-nowrap px-4 py-3', r.paymentStatus === 'OVERDUE' ? 'font-medium text-red-600' : 'text-stone-600')}>
                                        {fmtDate(r.confirmedDueDate || r.dueDate)}
                                    </td>
                                    <td className='px-4 py-3'>
                                        <StatusBadge label={APPROVAL_LABELS[r.approvalStatus] || r.approvalStatus} tone={APPROVAL_TONE[r.approvalStatus]} />
                                    </td>
                                    <td className='px-4 py-3'>
                                        <StatusBadge label={PAYMENT_LABELS[r.paymentStatus] || r.paymentStatus} tone={PAYMENT_TONE[r.paymentStatus]} />
                                    </td>
                                    <td className='whitespace-nowrap px-4 py-3 text-stone-500'>{fmtDate(r.createdAt)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <PaymentRequestFormModal
                    projects={projects}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleCreate}
                    isSubmitting={isCreating}
                    currentUserId={myId}
                />
            )}

            {selectedRequest && (
                <PaymentRequestDetailModal
                    key={`${selectedRequest.id}:${selectedRequest.updatedAt || selectedRequest.approvalStatus}`}
                    request={selectedRequest}
                    currentUserRole={me?.role}
                    currentUserId={myId}
                    onClose={closeDetail}
                />
            )}
        </div>
    );
};
