import { Fragment, useEffect, useMemo, useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronRight, Eye, FileText, X, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber } from '../../../utils/format';
import {
    useBodApproveAddendumMutation,
    useBodRejectAddendumMutation,
    useResubmitAddendumMutation,
    useSaleApproveAddendumMutation,
    useSaleRejectAddendumMutation,
} from '../../../api/contractAddendums';

const STATUS_LABELS = {
    DRAFT: 'Nháp',
    SIGNED: 'Đã ký',
    CANCELLED: 'Đã hủy',
    PENDING_SALE: 'Chờ Sale duyệt',
    SALE_REJECTED: 'Sale từ chối',
    PENDING_BOD: 'Chờ BOD duyệt',
    BOD_REJECTED: 'BOD từ chối',
    APPROVED: 'Đã duyệt',
};

const STATUS_CLASSES = {
    DRAFT: 'bg-gray-50 text-gray-600 border-gray-200',
    SIGNED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
    PENDING_SALE: 'bg-amber-50 text-amber-700 border-amber-200',
    SALE_REJECTED: 'bg-red-50 text-red-700 border-red-200',
    PENDING_BOD: 'bg-blue-50 text-blue-700 border-blue-200',
    BOD_REJECTED: 'bg-red-50 text-red-700 border-red-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const TYPE_LABELS = {
    MONTHLY_TASKS: 'Công việc tháng mới',
    ADD_SERVICES: 'Bổ sung dịch vụ',
    MANUAL: 'Thủ công',
};

const STANDALONE = 'STANDALONE';

const PRICE_TYPES = {
    RECOMMENDED: 'recommended',
    MINIMUM: 'minimum',
    CUSTOM: 'custom',
};

const roundToTenThousands = (value) => Math.ceil(Number(value || 0) / 10000) * 10000;

const calculatePriceByType = (item, priceType) => {
    const cost = Number(item.cost || 0);
    if (priceType === PRICE_TYPES.MINIMUM) return roundToTenThousands(cost / 0.8);
    if (priceType === PRICE_TYPES.RECOMMENDED) return roundToTenThousands(cost / 0.6);
    return Number(item.sellingPrice || 0);
};

const getServiceKey = (item, index) =>
    item.serviceId || item.sourceContractServiceId || item.serviceName || `service-${index}`;

const buildGroupedItems = (selectedItems = []) => {
    const packages = {};
    const standaloneMap = {};

    selectedItems.forEach((item, index) => {
        const quantity = Number(item.quantity || 1);
        const sellingPrice = Number(item.sellingPrice || 0);
        const cost = Number(item.cost || 0);
        const normalizedItem = {
            ...item,
            itemIndexes: [index],
            quantity,
            sellingPrice,
            cost,
            lineSellingPrice: sellingPrice * quantity,
            lineCost: cost * quantity,
            lineVat: sellingPrice * quantity * 0.08,
            lineTotalWithVat: sellingPrice * quantity * 1.08,
            unit: item.unit || '',
            description: item.description || item.service?.description || '',
        };

        if (!item.packageName || item.packageName === STANDALONE) {
            const serviceKey = getServiceKey(item, index);
            if (!standaloneMap[serviceKey]) {
                standaloneMap[serviceKey] = {
                    ...normalizedItem,
                    count: 0,
                    sellingPrice: 0,
                    cost: 0,
                    lineSellingPrice: 0,
                    lineCost: 0,
                    lineVat: 0,
                    lineTotalWithVat: 0,
                    itemIndexes: [],
                };
            }
            standaloneMap[serviceKey].count += normalizedItem.quantity;
            standaloneMap[serviceKey].sellingPrice = normalizedItem.sellingPrice;
            standaloneMap[serviceKey].cost = normalizedItem.cost;
            standaloneMap[serviceKey].lineSellingPrice += normalizedItem.lineSellingPrice;
            standaloneMap[serviceKey].lineCost += normalizedItem.lineCost;
            standaloneMap[serviceKey].lineVat += normalizedItem.lineVat;
            standaloneMap[serviceKey].lineTotalWithVat += normalizedItem.lineTotalWithVat;
            standaloneMap[serviceKey].itemIndexes.push(index);
            return;
        }

        const packageKey = item.packageKey || item.packageName;
        if (!packages[packageKey]) {
            packages[packageKey] = {
                key: packageKey,
                packageName: item.packageName,
                services: {},
                sellingPrice: 0,
                cost: 0,
                vat: 0,
                totalWithVat: 0,
            };
        }

        const serviceKey = getServiceKey(item, index);
        if (!packages[packageKey].services[serviceKey]) {
            packages[packageKey].services[serviceKey] = {
                ...normalizedItem,
                count: 0,
                sellingPrice: 0,
                cost: 0,
                lineSellingPrice: 0,
                lineCost: 0,
                lineVat: 0,
                lineTotalWithVat: 0,
                itemIndexes: [],
            };
        }

        packages[packageKey].services[serviceKey].count += normalizedItem.quantity;
        packages[packageKey].services[serviceKey].sellingPrice = normalizedItem.sellingPrice;
        packages[packageKey].services[serviceKey].cost = normalizedItem.cost;
        packages[packageKey].services[serviceKey].lineSellingPrice += normalizedItem.lineSellingPrice;
        packages[packageKey].services[serviceKey].lineCost += normalizedItem.lineCost;
        packages[packageKey].services[serviceKey].lineVat += normalizedItem.lineVat;
        packages[packageKey].services[serviceKey].lineTotalWithVat += normalizedItem.lineTotalWithVat;
        packages[packageKey].services[serviceKey].itemIndexes.push(index);
        packages[packageKey].sellingPrice += normalizedItem.lineSellingPrice;
        packages[packageKey].cost += normalizedItem.lineCost;
        packages[packageKey].vat += normalizedItem.lineVat;
        packages[packageKey].totalWithVat += normalizedItem.lineTotalWithVat;
    });

    return {
        packages: Object.values(packages).map((pkg) => {
            const items = Object.values(pkg.services);
            const packageQuantity = Math.max(
                1,
                ...items.map((item) => Number(item.packageQuantity || item.count || 1))
            );

            return {
                ...pkg,
                quantity: packageQuantity,
                items,
            };
        }),
        standalone: Object.values(standaloneMap),
    };
};

const normalizeCode = (value) => String(value || '').trim().toUpperCase();

const getUserRole = (user) =>
    normalizeCode(user?.role || user?.account?.role || user?.user?.role || user?.data?.role || user?.data?.account?.role);

const getAddendumStatus = (addendum) => normalizeCode(addendum?.status);

export const ContractAddendums = ({ addendums = [], currentUser }) => {
    const [selectedAddendum, setSelectedAddendum] = useState(null);
    const [rejectRequest, setRejectRequest] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [saleApprove, { isLoading: isSaleApproving }] = useSaleApproveAddendumMutation();
    const [saleReject, { isLoading: isSaleRejecting }] = useSaleRejectAddendumMutation();
    const [resubmitAddendum, { isLoading: isResubmitting }] = useResubmitAddendumMutation();
    const [bodApprove, { isLoading: isBodApproving }] = useBodApproveAddendumMutation();
    const [bodReject, { isLoading: isBodRejecting }] = useBodRejectAddendumMutation();

    if (!addendums || addendums.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                <p className="text-sm italic text-gray-500">Chưa có phụ lục nào</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const handleAction = async (action, id, successMessage, note = '', extraBody = {}) => {
        try {
            await action({ id, note, ...extraBody }).unwrap();
            toast.success(successMessage);
            setSelectedAddendum(null);
            setRejectRequest(null);
            setRejectReason('');
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi xử lý phụ lục');
        }
    };

    const openRejectModal = (action, id, successMessage) => {
        setRejectReason('');
        setRejectRequest({ action, id, successMessage });
    };

    const submitReject = () => {
        const note = rejectReason.trim();
        if (!note) {
            toast.error('Vui lòng nhập lý do không duyệt');
            return;
        }
        handleAction(rejectRequest.action, rejectRequest.id, rejectRequest.successMessage, note);
    };

    const userRole = getUserRole(currentUser);
    const isSale = ['BD', 'ADMIN'].includes(userRole);
    const isBod = ['BOD', 'ADMIN'].includes(userRole);
    const isPmOrAdmin = ['PM', 'ADMIN'].includes(userRole);
    const isMutating = isSaleApproving || isSaleRejecting || isResubmitting || isBodApproving || isBodRejecting;

    return (
        <>
            <div className="space-y-4">
                {addendums.map((addendum) => {
                    const sellingPrice = parseFloat(addendum.sellingPrice || 0);
                    const selectedItems = Array.isArray(addendum.selectedItems) ? addendum.selectedItems : [];

                    return (
                        <button
                            key={addendum.id}
                            type="button"
                            onClick={() => setSelectedAddendum(addendum)}
                            className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:border-purple-200 hover:shadow-md"
                        >
                            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                                <div className="flex min-w-0 flex-1 gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_CLASSES[addendum.status] || STATUS_CLASSES.DRAFT}`}>
                                                {STATUS_LABELS[addendum.status] || addendum.status}
                                            </span>
                                            {addendum.monthKey && (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-600">
                                                    {addendum.monthKey}
                                                </span>
                                            )}
                                            {TYPE_LABELS[addendum.type] && (
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600">
                                                    {TYPE_LABELS[addendum.type]}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="truncate text-lg font-bold text-gray-900">{addendum.name}</h4>
                                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {formatDate(addendum.createdAt)}
                                            </span>
                                            <span>{selectedItems.length} dịch vụ</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center justify-between gap-5 border-t border-gray-50 pt-4 md:border-t-0 md:pt-0">
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Giá trị</p>
                                        <p className="text-lg font-black text-blue-600">{formatCurrency(sellingPrice)}</p>
                                    </div>
                                    <span className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700">
                                        <Eye className="h-4 w-4" />
                                        Chi tiết
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedAddendum && (
                <AddendumDetailModal
                    addendum={selectedAddendum}
                    isSale={isSale}
                    isBod={isBod}
                    isPmOrAdmin={isPmOrAdmin}
                    isMutating={isMutating}
                    formatDate={formatDate}
                    onClose={() => setSelectedAddendum(null)}
                    onSaleApprove={(selectedItems) => handleAction(saleApprove, selectedAddendum.id, 'Đã duyệt phụ lục', '', { selectedItems })}
                    onSaleReject={() => openRejectModal(saleReject, selectedAddendum.id, 'Đã không duyệt phụ lục')}
                    onResubmit={(selectedItems) => handleAction(resubmitAddendum, selectedAddendum.id, 'Đã gửi lại phụ lục', '', { selectedItems })}
                    onBodApprove={() => handleAction(bodApprove, selectedAddendum.id, 'Đã duyệt và sinh công việc')}
                    onBodReject={() => openRejectModal(bodReject, selectedAddendum.id, 'Đã không duyệt phụ lục')}
                />
            )}

            {rejectRequest && (
                <RejectReasonModal
                    reason={rejectReason}
                    isLoading={isMutating}
                    onChange={setRejectReason}
                    onClose={() => {
                        setRejectRequest(null);
                        setRejectReason('');
                    }}
                    onSubmit={submitReject}
                />
            )}
        </>
    );
};

const RejectReasonModal = ({ reason, isLoading, onChange, onClose, onSubmit }) => (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Lý do không duyệt</h3>
                    <p className="mt-1 text-sm text-gray-500">Sale/BOD cần nhập lý do để người tạo phụ lục xử lý lại.</p>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100">
                    <X className="h-5 w-5" />
                </button>
            </div>
            <textarea
                value={reason}
                onChange={(event) => onChange(event.target.value)}
                rows={4}
                autoFocus
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="Nhập lý do không duyệt..."
            />
            <div className="mt-5 flex flex-col gap-3 md:flex-row md:justify-end">
                <button
                    onClick={onClose}
                    className="rounded-xl bg-white px-4 py-3 font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
                >
                    Hủy
                </button>
                <button
                    disabled={isLoading}
                    onClick={onSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                    <XCircle className="h-4 w-4" />
                    Không duyệt
                </button>
            </div>
        </div>
    </div>
);

const AddendumDetailModal = ({
    addendum,
    isSale,
    isBod,
    isPmOrAdmin,
    isMutating,
    formatDate,
    onClose,
    onSaleApprove,
    onSaleReject,
    onResubmit,
    onBodApprove,
    onBodReject,
}) => {
    const [expandedPackages, setExpandedPackages] = useState({});
    const [expandedServices, setExpandedServices] = useState({});
    const [priceType, setPriceType] = useState(PRICE_TYPES.CUSTOM);
    const selectedItems = Array.isArray(addendum.selectedItems) ? addendum.selectedItems : [];
    const [editableItems, setEditableItems] = useState(selectedItems);
    const addendumStatus = getAddendumStatus(addendum);
    const canSaleReview = isSale && addendumStatus === 'PENDING_SALE';
    const canBodReview = isBod && addendumStatus === 'PENDING_BOD';
    const canResubmit = isPmOrAdmin && ['SALE_REJECTED', 'BOD_REJECTED'].includes(addendumStatus);
    const canReview = canSaleReview || canBodReview;
    const canEditPrices = canSaleReview || canResubmit;
    const canEditCustomPrices = canEditPrices && priceType === PRICE_TYPES.CUSTOM;
    const groupedItems = useMemo(() => buildGroupedItems(editableItems), [editableItems]);
    const sellingPrice = useMemo(() => editableItems.reduce((sum, item) =>
        sum + Number(item.sellingPrice || 0) * Number(item.quantity || 1), 0), [editableItems]);
    const cost = useMemo(() => editableItems.reduce((sum, item) =>
        sum + Number(item.cost || 0) * Number(item.quantity || 1), 0), [editableItems]);
    const vat = sellingPrice * 0.08;
    const totalWithVat = sellingPrice + vat;
    const profit = sellingPrice - cost;
    const profitMargin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : 0;

    useEffect(() => {
        setEditableItems(selectedItems);
        setPriceType(PRICE_TYPES.CUSTOM);
    }, [addendum.id]);

    const handlePriceTypeChange = (type) => {
        setPriceType(type);
        if (type === PRICE_TYPES.CUSTOM) return;

        setEditableItems((prev) => prev.map((item) => ({
            ...item,
            sellingPrice: calculatePriceByType(item, type),
        })));
    };

    const updateItemSellingPrice = (itemIndexes = [], value) => {
        setEditableItems((prev) => prev.map((item, index) => (
            itemIndexes.includes(index)
                ? { ...item, sellingPrice: value }
                : item
        )));
    };

    const updatePackageSellingPrice = (pkg, value) => {
        const packageIndexes = pkg.items.flatMap((item) => item.itemIndexes || []);
        const packageIndexSet = new Set(packageIndexes);
        const newTotal = Number(value || 0);

        setEditableItems((prev) => {
            const currentTotal = packageIndexes.reduce((sum, index) => {
                const item = prev[index];
                return sum + Number(item?.sellingPrice || 0) * Number(item?.quantity || 1);
            }, 0);
            const totalCost = packageIndexes.reduce((sum, index) => {
                const item = prev[index];
                return sum + Number(item?.cost || 0) * Number(item?.quantity || 1);
            }, 0);

            return prev.map((item, index) => {
                if (!packageIndexSet.has(index)) return item;

                const quantity = Number(item.quantity || 1);
                const currentLinePrice = Number(item.sellingPrice || 0) * quantity;
                const costLine = Number(item.cost || 0) * quantity;
                const fallbackShare = packageIndexes.length > 0 ? newTotal / packageIndexes.length : 0;
                const newLinePrice = currentTotal > 0
                    ? currentLinePrice * (newTotal / currentTotal)
                    : totalCost > 0
                        ? newTotal * (costLine / totalCost)
                        : fallbackShare;

                return {
                    ...item,
                    sellingPrice: quantity > 0 ? newLinePrice / quantity : newLinePrice,
                };
            });
        });
    };

    const togglePackage = (packageKey) => {
        setExpandedPackages((prev) => ({
            ...prev,
            [packageKey]: !prev[packageKey],
        }));
    };

    const toggleService = (serviceKey) => {
        setExpandedServices((prev) => ({
            ...prev,
            [serviceKey]: !prev[serviceKey],
        }));
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
            <div className="flex max-h-[92vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-md border border-white/20 bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-6">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-purple-600" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{addendum.name}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(addendum.createdAt)}
                                </span>
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_CLASSES[addendum.status] || STATUS_CLASSES.DRAFT}`}>
                                    {STATUS_LABELS[addendum.status] || addendum.status}
                                </span>
                                {addendum.monthKey && (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-600">
                                        {addendum.monthKey}
                                    </span>
                                )}
                                {TYPE_LABELS[addendum.type] && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600">
                                        {TYPE_LABELS[addendum.type]}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">

                        {addendum.description && (
                            <div className="rounded-xl bg-purple-50 p-4">
                                <p className="mb-1 text-sm font-medium text-gray-700">Ghi chú:</p>
                                <p className="whitespace-pre-wrap text-sm text-gray-600">{addendum.description}</p>
                            </div>
                        )}

                        {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="rounded-xl border border-gray-100/50 bg-gray-50/50 p-3">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Giá trị phụ lục</p>
                                <p className="text-lg font-black text-blue-600">{formatCurrency(sellingPrice)}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100/50 bg-gray-50/50 p-3">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">VAT (8%)</p>
                                <p className="text-lg font-bold text-gray-700">{formatCurrency(vat)}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100/50 bg-gray-50/50 p-3">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Giá vốn</p>
                                <p className="text-lg font-bold text-gray-700">{formatCurrency(cost)}</p>
                            </div>
                            <div className="rounded-xl border border-purple-100/50 bg-purple-50/50 p-3">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">Lợi nhuận</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-lg font-black text-purple-700">{formatCurrency(profit)}</p>
                                    <span className="text-xs font-bold text-purple-500">({profitMargin}%)</span>
                                </div>
                            </div>
                        </div> */}

                        <div>
                            <h4 className="mb-3 font-semibold text-gray-900">Chi tiết dịch vụ</h4>

                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dịch vụ</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Số lượng</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Đơn giá</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá vốn</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">VAT (8%)</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedItems.packages.map((pkg, pIdx) => {
                                            const packageKey = `pkg-${pIdx}-${pkg.key}`;
                                            const isPackageExpanded = Boolean(expandedPackages[packageKey]);

                                            return (
                                                <Fragment key={packageKey}>
                                                    <tr
                                                        className="cursor-pointer border-b border-blue-100/50 bg-blue-50/30"
                                                        onClick={() => togglePackage(packageKey)}
                                                    >
                                                        <td className="px-4 py-3 text-sm font-bold text-blue-900">
                                                            <div className="flex items-center gap-2">
                                                                {isPackageExpanded ? (
                                                                    <ChevronDown className="h-4 w-4 shrink-0 text-blue-700" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4 shrink-0 text-blue-700" />
                                                                )}
                                                                <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                                                                    Gói
                                                                </span>
                                                                {pkg.packageName || pkg.key}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1 shadow-sm">
                                                                <span className="text-sm font-bold text-blue-900">{pkg.quantity}</span>
                                                                <span className="text-[10px] font-black uppercase tracking-tighter text-blue-400">
                                                                    Gói
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-bold text-blue-900">
                                                            {canEditCustomPrices ? (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="1000"
                                                                    value={Math.round(pkg.sellingPrice)}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                    onChange={(event) => updatePackageSellingPrice(pkg, event.target.value)}
                                                                    className="h-9 w-40 rounded-lg border border-blue-200 bg-white px-3 text-right text-sm font-bold text-blue-900 outline-none focus:border-blue-500"
                                                                />
                                                            ) : (
                                                                formatNumber(Math.round(pkg.sellingPrice))
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm italic text-blue-700">
                                                            {formatNumber(Math.round(pkg.cost))}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-bold text-blue-900">
                                                            {formatNumber(Math.round(pkg.vat))}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-black italic text-blue-900">
                                                            {formatNumber(Math.round(pkg.totalWithVat))}
                                                        </td>
                                                    </tr>

                                                    {isPackageExpanded &&
                                                        pkg.items.map((item, iIdx) => {
                                                            const serviceKey = `${packageKey}-item-${iIdx}`;
                                                            const isServiceExpanded = Boolean(expandedServices[serviceKey]);

                                                            return (
                                                                <Fragment key={serviceKey}>
                                                                    <tr
                                                                        className="cursor-pointer border-b border-gray-50/50 bg-blue-50/5 hover:bg-blue-50/20"
                                                                        onClick={() => toggleService(serviceKey)}
                                                                    >
                                                                        <td className="px-4 py-2 pl-10 text-sm italic text-gray-500">
                                                                            <div className="flex items-center gap-2">
                                                                                {isServiceExpanded ? (
                                                                                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                                                                                ) : (
                                                                                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                                                                )}
                                                                                <span className="font-medium text-gray-600">{item.serviceName}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            <span className="text-xs font-bold text-gray-500">
                                                                                {item.count || 1} {item.unit || ''} / Gói
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right text-xs font-medium italic text-gray-400">
                                                                            {formatNumber(Math.round(item.sellingPrice))}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right text-xs font-medium italic text-gray-400">
                                                                            {formatNumber(Math.round(item.lineCost))}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right text-xs font-medium italic text-gray-400">
                                                                            {formatNumber(Math.round(item.lineVat))}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right text-xs font-medium italic text-gray-400">
                                                                            {formatNumber(Math.round(item.lineTotalWithVat))}
                                                                        </td>
                                                                    </tr>

                                                                    {isServiceExpanded && (
                                                                        <tr className="border-b border-gray-50/50 bg-blue-50/10">
                                                                            <td
                                                                                colSpan={6}
                                                                                className="px-4 py-3 pl-16 text-[11px] leading-relaxed text-gray-500"
                                                                            >
                                                                                <p className="whitespace-pre-wrap">
                                                                                    {item.description || 'Không có mô tả'}
                                                                                </p>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </Fragment>
                                                            );
                                                        })}
                                                </Fragment>
                                            );
                                        })}

                                        {groupedItems.standalone.length > 0 && (
                                            <>
                                                <tr className="border-b border-gray-100 bg-gray-50">
                                                    <td
                                                        colSpan={6}
                                                        className="bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
                                                    >
                                                        Dịch vụ lẻ
                                                    </td>
                                                </tr>

                                                {groupedItems.standalone.map((item, idx) => {
                                                    const serviceKey = `standalone-${idx}`;
                                                    const isServiceExpanded = Boolean(expandedServices[serviceKey]);

                                                    return (
                                                        <Fragment key={serviceKey}>
                                                            <tr
                                                                className="group cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                                                                onClick={() => toggleService(serviceKey)}
                                                            >
                                                                <td className="px-4 py-3 text-sm font-medium italic text-gray-900 transition-colors group-hover:text-purple-700">
                                                                    <div className="flex items-center gap-2">
                                                                        {isServiceExpanded ? (
                                                                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                                                                        ) : (
                                                                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                                                        )}
                                                                        <span className="font-bold text-gray-900">{item.serviceName}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="px-2 py-1 text-sm font-bold text-gray-900">
                                                                        {item.count || 1} {item.unit || ''}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-sm text-gray-700">
                                                                    {canEditCustomPrices ? (
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1000"
                                                                            value={item.sellingPrice}
                                                                            onClick={(event) => event.stopPropagation()}
                                                                            onChange={(event) => updateItemSellingPrice(item.itemIndexes, event.target.value)}
                                                                            className="h-9 w-36 rounded-lg border border-gray-200 px-3 text-right text-sm outline-none focus:border-blue-500"
                                                                        />
                                                                    ) : (
                                                                        formatNumber(Math.round(item.sellingPrice))
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-sm italic text-gray-500">
                                                                    {formatNumber(Math.round(item.lineCost))}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-sm font-black italic text-gray-900">
                                                                    {formatNumber(Math.round(item.lineVat))}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-sm font-black italic text-gray-900">
                                                                    {formatNumber(Math.round(item.lineTotalWithVat))}
                                                                </td>
                                                            </tr>

                                                            {isServiceExpanded && (
                                                                <tr className="border-b border-gray-100 bg-gray-50/70">
                                                                    <td
                                                                        colSpan={6}
                                                                        className="px-4 py-3 pl-10 text-xs leading-relaxed text-gray-500"
                                                                    >
                                                                        <p className="whitespace-pre-wrap">{item.description || 'Không có mô tả'}</p>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
                                                    );
                                                })}
                                            </>
                                        )}

                                        {editableItems.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-10 text-center text-sm italic text-gray-400">
                                                    Chưa có dịch vụ nào trong phụ lục.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 font-semibold">
                                            <td colSpan="5" className="px-4 py-3 text-right text-sm text-gray-700">
                                                Tổng cộng (có VAT):
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-black text-gray-900">
                                                {formatNumber(Math.round(totalWithVat))} VNĐ
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {(addendum.saleReviewNote || addendum.bodReviewNote) && (
                            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                {addendum.saleReviewNote && <p><span className="font-bold">Sale:</span> {addendum.saleReviewNote}</p>}
                                {addendum.bodReviewNote && <p><span className="font-bold">BOD:</span> {addendum.bodReviewNote}</p>}
                            </div>
                        )}
                    </div>
                    {canEditPrices && (
                        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4 mt-3">
                            {canResubmit && (
                                <p className="text-sm font-medium text-blue-900">
                                    Phụ lục đã bị từ chối. PM có thể chỉnh đơn giá rồi gửi lại để duyệt từ bước Sale.
                                </p>
                            )}
                            <div className="flex flex-wrap gap-4">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        name={`priceType-${addendum.id}`}
                                        value={PRICE_TYPES.RECOMMENDED}
                                        checked={priceType === PRICE_TYPES.RECOMMENDED}
                                        onChange={(event) => handlePriceTypeChange(event.target.value)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Chọn giá bán đề xuất</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        name={`priceType-${addendum.id}`}
                                        value={PRICE_TYPES.MINIMUM}
                                        checked={priceType === PRICE_TYPES.MINIMUM}
                                        onChange={(event) => handlePriceTypeChange(event.target.value)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Chọn giá bán tối thiểu</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        name={`priceType-${addendum.id}`}
                                        value={PRICE_TYPES.CUSTOM}
                                        checked={priceType === PRICE_TYPES.CUSTOM}
                                        onChange={(event) => handlePriceTypeChange(event.target.value)}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Chọn giá bán tùy chỉnh</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 md:flex-row md:justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-white px-4 py-3 font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
                    >
                        Đóng
                    </button>
                    {canResubmit && (
                        <button
                            disabled={isMutating}
                            onClick={() => onResubmit(editableItems)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                            Gửi lại
                        </button>
                    )}
                    {canReview && (
                        <>
                            <button
                                disabled={isMutating}
                                onClick={canSaleReview ? onSaleReject : onBodReject}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                                <XCircle className="h-4 w-4" />
                                Không duyệt
                            </button>
                            <button
                                disabled={isMutating}
                                onClick={canSaleReview ? () => onSaleApprove(editableItems) : onBodApprove}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <Check className="h-4 w-4" />
                                Duyệt
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
