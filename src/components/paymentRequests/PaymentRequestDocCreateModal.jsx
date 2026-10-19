import { useState, useEffect } from 'react';
import {
    FileText, Download, CheckCircle, Upload, Loader2, Sparkles, AlertCircle, FileCheck, ExternalLink, RefreshCw,
    Eye, Edit3, ArrowLeft
} from 'lucide-react';
import { ModalShell, ModalHeader } from './PaymentRequestParts';
import { inputCls, labelCls, btnPrimary, btnSecondary } from './paymentRequestConfig';
import { readMoneyToWords } from '../../utils/numberToWordsVi';
import { formatNumber, parseNumber } from '../../utils/format';
import { useGetNextPaymentRequestSttQuery, useGenerateWordAndUploadPaymentRequestDocMutation } from '../../api/paymentRequests';
import { BASE_URL } from '../../store/api';
import { cn } from '../../utils/cn';

const getCurrentDateDDMMYYYY = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
};

const getCurrentDateParts = (dateStr) => {
    if (dateStr && typeof dateStr === 'string') {
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                // YYYY-MM-DD
                return {
                    dd: parts[2].padStart(2, '0'),
                    mm: parts[1].padStart(2, '0'),
                    yy: parts[0].slice(-2),
                    fullYear: parts[0]
                };
            } else {
                // DD/MM/YYYY
                return {
                    dd: parts[0].padStart(2, '0'),
                    mm: parts[1].padStart(2, '0'),
                    yy: parts[2].slice(-2),
                    fullYear: parts[2]
                };
            }
        }
    }
    const now = new Date();
    return {
        dd: String(now.getDate()).padStart(2, '0'),
        mm: String(now.getMonth() + 1).padStart(2, '0'),
        yy: String(now.getFullYear()).slice(-2),
        fullYear: String(now.getFullYear())
    };
};

const getNormalizedProjectName = (projName, requestType) => {
    const raw = (projName || '').trim();
    if (requestType === 'OTHER_WORK' || !raw || raw === 'Công việc khác' || raw === 'CongViecKhac' || raw === 'Cong_viec_khac') {
        return 'CongViecKhac';
    }
    const clean = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    return clean || 'GETVINI';
};

// Với role BD, BOD, PM thì chức vụ là Quản lý, còn lại toàn bộ là Nhân viên
export const getPositionByRole = (role) => {
    if (!role) return 'Nhân viên';
    const upper = String(role).toUpperCase().trim();
    if (['BD', 'BOD', 'PM'].includes(upper)) {
        return 'Quản lý';
    }
    return 'Nhân viên';
};

// Phòng ban: BD là Phòng kinh doanh, ADMIN_SALE là Phòng hành chính nhân sự,
// Editor, content, design, PM là Phòng dự án, còn lại là để trống
export const getDepartmentByRole = (role) => {
    if (!role) return '';
    const upper = String(role).toUpperCase().trim();
    if (upper === 'BD') return 'Phòng kinh doanh';
    if (upper === 'ADMIN_SALE' || upper === 'ADMIN_SALES') return 'Phòng hành chính nhân sự';
    if (['EDITOR', 'CONTENT', 'DESIGN', 'PM'].includes(upper)) return 'Phòng dự án';
    return '';
};

export const toIsoDate = (val) => {
    if (!val) return '';
    if (typeof val !== 'string') {
        if (val instanceof Date && !isNaN(val.getTime())) {
            const yyyy = String(val.getFullYear());
            const mm = String(val.getMonth() + 1).padStart(2, '0');
            const dd = String(val.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
        return '';
    }
    const clean = val.trim();
    if (clean.includes('-')) {
        const parts = clean.split('T')[0].split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                // YYYY-MM-DD
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
            // DD-MM-YYYY
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    if (clean.includes('/')) {
        const parts = clean.split('/');
        if (parts.length === 3) {
            const [d, m, y] = parts;
            const fullY = y.length === 2 ? `20${y}` : y;
            return `${fullY}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
    }
    return '';
};

export const PaymentRequestDocCreateModal = ({
    isOpen,
    onClose,
    initialData = {},
    onApplyDoc,
    onUploadFile,
}) => {
    if (!isOpen) return null;
    const { data: sttData, isFetching: isFetchingStt } = useGetNextPaymentRequestSttQuery();

    const userRole = initialData.role || '';
    const defaultPosition = initialData.position || getPositionByRole(userRole);
    const defaultDepartment = initialData.department !== undefined ? initialData.department : getDepartmentByRole(userRole);

    const [viewMode, setViewMode] = useState('FORM'); // 'FORM' | 'PREVIEW'
    const [voucherNo, setVoucherNo] = useState(initialData.voucherNo || '');
    const [requestDate, setRequestDate] = useState(initialData.requestDate || getCurrentDateDDMMYYYY());
    const [requesterName, setRequesterName] = useState(initialData.requesterName || '');
    const [position, setPosition] = useState(defaultPosition);
    const [department, setDepartment] = useState(defaultDepartment);
    const [projectName, setProjectName] = useState(initialData.projectName || '');
    const [amount, setAmount] = useState(initialData.amount ? formatNumber(initialData.amount) : '');
    const [amountInWords, setAmountInWords] = useState('');
    const [reason, setReason] = useState(initialData.reason || '');
    const [dueDate, setDueDate] = useState(toIsoDate(initialData.dueDate) || '');
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Đồng bộ giá trị khi initialData thay đổi từ ngoài form chính
    useEffect(() => {
        if (initialData.amount !== undefined && initialData.amount !== '') {
            setAmount(formatNumber(initialData.amount));
        }
        if (initialData.reason !== undefined && initialData.reason !== '') {
            setReason(initialData.reason);
        }
        if (initialData.dueDate !== undefined && initialData.dueDate !== '') {
            setDueDate(toIsoDate(initialData.dueDate));
        }
        if (initialData.projectName !== undefined && initialData.projectName !== '') {
            setProjectName(initialData.projectName);
        }
        if (initialData.requesterName) {
            setRequesterName(initialData.requesterName);
        }
    }, [initialData.amount, initialData.reason, initialData.dueDate, initialData.projectName, initialData.requesterName]);

    // Tự động gán STT từ backend nếu chưa có
    useEffect(() => {
        if (!voucherNo && sttData?.nextStt) {
            setVoucherNo(sttData.nextStt);
        }
    }, [sttData, voucherNo]);

    // Tự động tính số tiền bằng chữ khi số tiền thay đổi
    useEffect(() => {
        const num = parseNumber(amount);
        if (num > 0) {
            const words = readMoneyToWords(num);
            setAmountInWords(words);
        } else {
            setAmountInWords('');
        }
    }, [amount]);

    // Chuẩn hóa tên file theo đúng công thức chuẩn Getvini: ngày tháng năm / tên dự án / năm / DNTT-GETVINI_STT
    const dateParts = getCurrentDateParts(requestDate);
    const cleanProject = getNormalizedProjectName(projectName, initialData.requestType);
    const stt = voucherNo ? String(voucherNo).padStart(2, '0') : '01';
    const standardDisplayFormula = `${dateParts.dd}${dateParts.mm}${dateParts.yy}/${cleanProject}/${dateParts.fullYear}/DNTT-GETVINI_${stt}.docx`;
    const safeDownloadFileName = `${dateParts.dd}${dateParts.mm}${dateParts.yy}_${cleanProject}_${dateParts.fullYear}_DNTT-GETVINI_${stt}.docx`;

    const handleAmountChange = (e) => {
        const raw = e.target.value.replace(/\D/g, '');
        setAmount(raw ? formatNumber(raw) : '');
    };

    // Tải file Word (.docx) về máy tính để chỉnh sửa
    const handleDownloadTemplate = async () => {
        setError('');
        if (!requesterName.trim()) {
            setError('Vui lòng nhập họ và tên người đề nghị');
            return;
        }
        if (!amount || parseNumber(amount) <= 0) {
            setError('Vui lòng nhập số tiền thanh toán hợp lệ');
            return;
        }

        setIsDownloading(true);
        try {
            const params = new URLSearchParams({
                voucherNo: voucherNo || '01',
                requesterName: requesterName.trim(),
                requestDate: requestDate || getCurrentDateDDMMYYYY(),
                position: position.trim() || 'Nhân viên',
                department: department.trim() || '',
                amount: String(parseNumber(amount)),
                amountInWords: amountInWords.trim() || readMoneyToWords(parseNumber(amount)),
                reason: reason.trim() || '',
                dueDate: dueDate || '',
                projectName: projectName.trim() || '',
                customFileName: safeDownloadFileName,
            });

            const downloadUrl = `${BASE_URL}/payment-requests/download-template-word?${params.toString()}`;
            const res = await fetch(downloadUrl, { credentials: 'include' });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Không thể tải file mẫu');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = safeDownloadFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setSuccessMessage('Đã tải file Word về máy! Bạn có thể mở Word để chỉnh sửa thêm nếu muốn.');
        } catch (err) {
            setError(err.message || 'Lỗi khi tải file Word');
        } finally {
            setIsDownloading(false);
        }
    };

    // Đưa vào hồ sơ (Phương án 1: Không upload Cloudinary, lưu thông tin vào form để sinh và tải lên Drive khi Gửi yêu cầu)
    const handleGenerateAndApply = () => {
        setError('');
        if (!requesterName.trim()) {
            setError('Vui lòng nhập họ và tên người đề nghị');
            return;
        }
        if (!amount || parseNumber(amount) <= 0) {
            setError('Vui lòng nhập số tiền thanh toán hợp lệ');
            return;
        }

        const payload = {
            voucherNo: voucherNo || '01',
            requesterName: requesterName.trim(),
            requestDate: requestDate || getCurrentDateDDMMYYYY(),
            position: position.trim() || 'Nhân viên',
            department: department.trim() || '',
            amount: parseNumber(amount),
            amountInWords: amountInWords.trim() || readMoneyToWords(parseNumber(amount)),
            reason: reason.trim() || '',
            dueDate: dueDate || '',
            projectName: projectName.trim() || '',
            customFileName: safeDownloadFileName,
            displayFileName: standardDisplayFormula,
        };

        if (onApplyDoc) {
            onApplyDoc({
                id: `pending_doc_${Date.now()}`,
                name: standardDisplayFormula,
                standardName: standardDisplayFormula,
                safeUploadName: safeDownloadFileName,
                originalName: safeDownloadFileName,
                fileType: 'DOC',
                docType: 'PAYMENT_REQUEST_DOC',
                isGeneratedDoc: true,
                docData: payload,
                uploading: false,
                isStandard: true,
                size: 0,
                url: '',
            });
        }
        onClose();
    };

    // Khi người dùng chọn upload file Word đã sửa trực tiếp trong modal
    const handleDropEditedFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.match(/\.(docx?|pdf)$/i)) {
            setError('Vui lòng chọn file Word (.docx, .doc) hoặc PDF');
            return;
        }
        if (onUploadFile) {
            onUploadFile([file], 'PAYMENT_REQUEST_DOC');
            onClose();
        }
    };

    return (
        <ModalShell onClose={onClose} maxWidth={viewMode === 'PREVIEW' ? 'max-w-3xl' : 'max-w-xl'}>
            <ModalHeader
                icon={FileText}
                title='Lập Giấy đề nghị thanh toán'
                subtitle='Điền thông tin xuất file Word chuẩn Getvini hoặc đính kèm trực tiếp vào hồ sơ'
                onClose={onClose}
            />

            {/* Thanh chuyển đổi chế độ xem: Điền thông tin | Xem trước bản mẫu */}
            <div className='flex items-center justify-between border-b border-stone-200 bg-stone-50/80 px-5 py-2 sm:px-6'>
                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setViewMode('FORM')}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
                            viewMode === 'FORM'
                                ? 'bg-white text-orange-600 shadow-2xs border border-stone-200'
                                : 'text-stone-500 hover:text-stone-800'
                        )}
                    >
                        <Edit3 size={13} />
                        <span>Điền thông tin</span>
                    </button>
                    <button
                        type='button'
                        onClick={() => setViewMode('PREVIEW')}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
                            viewMode === 'PREVIEW'
                                ? 'bg-white text-orange-600 shadow-2xs border border-stone-200'
                                : 'text-stone-500 hover:text-stone-800'
                        )}
                    >
                        <Eye size={13} />
                        <span>Xem trước bản mẫu</span>
                        <span className='rounded bg-orange-100 px-1 py-0.2 text-[10px] font-bold text-orange-700'>
                            Mẫu A4
                        </span>
                    </button>
                </div>
                <div className='text-[11px] text-stone-500 hidden sm:block'>
                    {viewMode === 'FORM' ? 'Đã nhập xong? Nhấn "Xem trước bản mẫu" để kiểm tra' : 'Mô phỏng file Word GiayDeNghiThanhToan.docx'}
                </div>
            </div>

            {viewMode === 'FORM' ? (
                <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6'>
                    {/* STT & Ngày đề nghị (Đều không cho sửa) */}
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <div>
                            <div className='flex items-center justify-between mb-1'>
                                <label className={labelCls}>
                                    Số chứng từ (STT Sheet) <span className='text-[11px] font-normal text-stone-400'>(Cố định)</span>
                                </label>
                                {isFetchingStt && <span className='text-[10px] text-orange-500 font-medium'>Đang lấy STT...</span>}
                            </div>
                            <input
                                type='text'
                                value={voucherNo || (isFetchingStt ? 'Đang lấy STT...' : '')}
                                readOnly
                                disabled
                                placeholder='01, 02...'
                                className={cn(inputCls, 'bg-stone-100/90 text-stone-600 cursor-not-allowed select-none font-mono font-semibold')}
                                title='Số chứng từ (STT Sheet) được tự động cấp, không thể sửa'
                            />
                        </div>
                        <div>
                            <label className={labelCls}>
                                Ngày đề nghị <span className='text-[11px] font-normal text-stone-400'>(Cố định)</span>
                            </label>
                            <input
                                type='text'
                                value={requestDate}
                                readOnly
                                disabled
                                placeholder='DD/MM/YYYY'
                                className={cn(inputCls, 'bg-stone-100/90 text-stone-600 cursor-not-allowed select-none font-mono font-semibold')}
                                title='Ngày đề nghị được tự động lấy theo ngày hiện tại, không thể sửa'
                            />
                        </div>
                    </div>

                    {/* Họ tên (Không cho sửa) & Chức vụ (Tự động theo Role) */}
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <div>
                            <label className={labelCls}>
                                Họ và tên người đề nghị <span className='text-[11px] font-normal text-stone-400'>(Tài khoản)</span>
                            </label>
                            <input
                                type='text'
                                value={requesterName}
                                readOnly
                                disabled
                                placeholder='Họ và tên'
                                className={cn(inputCls, 'bg-stone-100/90 text-stone-600 cursor-not-allowed select-none font-medium')}
                                title='Họ và tên người đề nghị được lấy theo tài khoản đăng nhập, không thể sửa'
                            />
                        </div>
                        <div>
                            <label className={labelCls}>
                                Chức vụ
                            </label>
                            <input
                                type='text'
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                placeholder='Quản lý / Nhân viên...'
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Bộ phận & Dự án */}
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <div>
                            <label className={labelCls}>
                                Bộ phận / Phòng ban
                            </label>
                            <input
                                type='text'
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder='Phòng kinh doanh / Phòng dự án...'
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>
                                Tên dự án
                            </label>
                            <input
                                type='text'
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder='Tên dự án liên quan'
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Nội dung thanh toán */}
                    <div>
                        <label className={labelCls}>
                            Nội dung thanh toán <span className='text-red-500'>*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                            placeholder='Lý do / nội dung chi phí sản xuất...'
                            className={inputCls}
                        />
                    </div>

                    {/* Số tiền & Hạn thanh toán */}
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <div>
                            <label className={labelCls}>
                                Số tiền (VNĐ) <span className='text-red-500'>*</span>
                            </label>
                            <div className='relative'>
                                <input
                                    type='text'
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder='0'
                                    className={inputCls}
                                />
                                <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400'>
                                    VNĐ
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>
                                Thời hạn thanh toán
                            </label>
                            <input
                                type='date'
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                placeholder='DD/MM/YYYY'
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Số tiền bằng chữ */}
                    <div>
                        <label className={labelCls}>
                            Số tiền viết bằng chữ
                        </label>
                        <input
                            type='text'
                            value={amountInWords}
                            onChange={(e) => setAmountInWords(e.target.value)}
                            placeholder='Tự động cập nhật theo số tiền...'
                            className={inputCls}
                        />
                    </div>

                    {/* Xem trước tên file chuẩn */}
                    <div className='rounded-xl border border-orange-200/80 bg-orange-50/50 p-3 space-y-1.5'>
                        <div className='flex items-center gap-2 text-xs font-semibold text-orange-900'>
                            <Sparkles size={14} className='text-orange-500' />
                            <span>Tên file Word chuẩn Getvini sinh ra:</span>
                        </div>
                        <p className='font-mono text-xs font-bold text-orange-700 bg-white p-2 rounded-lg border border-orange-200 break-all select-all'>
                            {standardDisplayFormula}
                        </p>
                        <p className='text-[11px] text-stone-500'>
                            Tên tệp khi lưu / tải về máy: <span className='font-mono font-medium text-stone-700'>{safeDownloadFileName}</span>
                        </p>
                    </div>

                    {/* Nút xem nhanh bản mẫu */}
                    <div className='pt-1'>
                        <button
                            type='button'
                            onClick={() => setViewMode('PREVIEW')}
                            className='w-full inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50/80 py-2.5 px-4 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 cursor-pointer shadow-2xs'
                        >
                            <Eye size={14} className='text-orange-600' />
                            <span>Xem trước bản mẫu Giấy đề nghị thanh toán ngay</span>
                        </button>
                    </div>

                    {/* Box upload lại file Word nếu người dùng đã tải về và chỉnh sửa */}
                    <div className='rounded-xl border border-stone-200 bg-stone-50/70 p-3 space-y-2'>
                        <span className='text-xs font-semibold text-stone-700 block'>
                            Hoặc tải lên file Word đã chỉnh sửa (nếu bạn đã sửa offline):
                        </span>
                        <label className='flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white py-2 px-3 text-center transition hover:border-gray-400 hover:bg-orange-50/30'>
                            <Upload size={13} className='text-stone-400' />
                            <span className='text-xs text-stone-600'>Chọn file Word đã chỉnh sửa từ máy</span>
                            <input
                                type='file'
                                accept='.docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                onChange={handleDropEditedFile}
                                className='hidden'
                            />
                        </label>
                    </div>

                    {successMessage && (
                        <p className='flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 border border-emerald-200'>
                            <CheckCircle size={14} className='shrink-0' /> {successMessage}
                        </p>
                    )}

                    {error && (
                        <p className='flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 border border-red-200'>
                            <AlertCircle size={14} className='shrink-0' /> {error}
                        </p>
                    )}
                </div>
            ) : (
                /* Tab Xem trước bản mẫu (Preview mô phỏng A4 chuẩn) */
                <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6 bg-stone-100/70'>
                    {/* Banner hướng dẫn */}
                    <div className='flex items-center justify-between rounded-lg bg-orange-50 p-2.5 text-xs text-orange-800 border border-orange-200 shadow-2xs'>
                        <div className='flex items-center gap-2'>
                            <FileCheck size={15} className='text-orange-600 shrink-0' />
                            <span>Đây là bản mô phỏng nội dung file Word <strong>GiayDeNghiThanhToan.docx</strong> chuẩn Getvini sinh ra.</span>
                        </div>
                        <button
                            type='button'
                            onClick={() => setViewMode('FORM')}
                            className='inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-[11px] font-semibold text-orange-700 border border-orange-200 hover:bg-orange-100 cursor-pointer shadow-2xs shrink-0'
                        >
                            <Edit3 size={11} /> Sửa thông tin
                        </button>
                    </div>

                    {/* Tờ giấy văn bản A4 màu trắng mô phỏng chuẩn Word (Times New Roman) */}
                    <div
                        className='rounded-xl border border-stone-300 bg-white p-6 sm:p-10 shadow-md space-y-4 text-stone-900 leading-relaxed'
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    >
                        {/* 1. Bảng Tiêu đề 2 cột: Đơn vị & Quốc hiệu Tiêu ngữ */}
                        <div className='grid grid-cols-2 gap-4 items-start text-xs sm:text-[13px]'>
                            <div className='text-center space-y-1'>
                                <p className='font-bold uppercase text-stone-900 text-[11px] sm:text-xs leading-tight'>
                                    CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TRUYỀN THÔNG KỸ THUẬT SỐ GETVINI
                                </p>
                            </div>
                            <div className='text-center space-y-1'>
                                <p className='font-bold uppercase text-stone-900 text-[11px] sm:text-xs leading-tight'>
                                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                                </p>
                                <p className='font-bold text-stone-900 text-xs sm:text-[13px]'>
                                    Độc lập - Tự do - Hạnh phúc
                                </p>
                                <div className='w-24 h-[1.5px] bg-stone-900 mx-auto mt-0.5'></div>
                            </div>
                        </div>

                        {/* 2. Số công văn */}
                        <div className='pt-1 text-xs sm:text-sm italic text-stone-800'>
                            <span>Số: </span>
                            <span className='font-bold font-mono text-stone-900'>{voucherNo || '01'}</span>
                        </div>

                        {/* 3. Tiêu đề chính & Ngày tháng bên dưới */}
                        <div className='text-center pt-2 pb-1 space-y-1'>
                            <h2 className='text-base sm:text-lg font-bold uppercase text-stone-900'>
                                GIẤY ĐỀ NGHỊ THANH TOÁN
                            </h2>
                            <p className='text-xs sm:text-[13px] italic text-stone-700'>
                                Thành phố Hồ Chí Minh, ngày {dateParts.dd} tháng {dateParts.mm} năm {dateParts.fullYear}
                            </p>
                        </div>

                        {/* 4. Kính gửi */}
                        <div className='text-xs sm:text-sm text-stone-800 pt-1'>
                            <span className='italic font-medium'>Kính gửi: </span>
                            <span>Ban Giám đốc và Bộ phận Kế toán CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TRUYỀN THÔNG KỸ THUẬT SỐ GETVINI</span>
                        </div>

                        {/* 5. Nội dung các mục (chuẩn từng dòng như Word) */}
                        <div className='space-y-2.5 text-xs sm:text-sm text-stone-900 pt-1'>
                            <div className='flex items-baseline gap-1.5'>
                                <span className='shrink-0'>Họ và tên người đề nghị:</span>
                                <span className='font-semibold flex-1 border-b border-dotted border-stone-400 pb-0.5'>
                                    {requesterName || '……………………………………………………………'}
                                </span>
                            </div>

                            <div className='flex items-baseline gap-1.5'>
                                <span className='shrink-0'>Chức vụ:</span>
                                <span className='font-semibold flex-1 border-b border-dotted border-stone-400 pb-0.5'>
                                    {position || '……………………………………………'}
                                </span>
                            </div>

                            <div className='flex items-baseline gap-1.5'>
                                <span className='shrink-0'>Bộ phận (Phòng/Ban):</span>
                                <span className='font-semibold flex-1 border-b border-dotted border-stone-400 pb-0.5'>
                                    {department || '………………………………'}
                                </span>
                            </div>

                            <div className='flex flex-wrap items-baseline gap-1 leading-normal'>
                                <span className='shrink-0'>Số tiền thanh toán</span>
                                <span className='font-bold text-orange-600 border-b border-dotted border-stone-400 px-1'>
                                    {amount ? `${formatNumber(parseNumber(amount))}` : '…………'}
                                </span>
                                <span>VNĐ</span>
                                <span className='ml-1'>(Bằng chữ:</span>
                                <span className='italic font-semibold text-stone-800 border-b border-dotted border-stone-400 px-1'>
                                    {amountInWords || '…………………………'}
                                </span>
                                <span>Việt Nam đồng)</span>
                            </div>

                            <div className='flex items-baseline gap-1.5'>
                                <span className='shrink-0'>Lý do:</span>
                                <span className='flex-1 border-b border-dotted border-stone-400 pb-0.5'>
                                    {reason || '…………………………………'}
                                </span>
                            </div>

                            <div className='flex flex-wrap items-baseline gap-1'>
                                <span className='shrink-0'>Thời hạn thanh toán tạm ứng:</span>
                                <span>ngày</span>
                                <span className='font-semibold border-b border-dotted border-stone-400 px-1.5'>
                                    {getCurrentDateParts(dueDate || requestDate).dd}
                                </span>
                                <span>tháng</span>
                                <span className='font-semibold border-b border-dotted border-stone-400 px-1.5'>
                                    {getCurrentDateParts(dueDate || requestDate).mm}
                                </span>
                                <span>năm</span>
                                <span className='font-semibold border-b border-dotted border-stone-400 px-1.5'>
                                    {getCurrentDateParts(dueDate || requestDate).fullYear}
                                </span>
                            </div>
                        </div>

                        {/* 6. Bảng chữ ký 2 cột chuẩn Word: GIÁM ĐỐC và NGƯỜI ĐỀ NGHỊ */}
                        <div className='grid grid-cols-2 gap-4 text-center text-xs sm:text-sm pt-8 mt-6 border-t border-stone-200'>
                            <div className='flex flex-col items-center justify-between min-h-[140px]'>
                                <div>
                                    <p className='font-bold uppercase text-stone-900'>GIÁM ĐỐC</p>
                                    <p className='text-[11px] italic text-stone-500'>(Ký, đóng dấu)</p>
                                </div>
                                <p className='font-bold uppercase text-stone-900 pt-12'>VÕ THỊ KIỀU NHI</p>
                            </div>
                            <div className='flex flex-col items-center justify-between min-h-[140px]'>
                                <div>
                                    <p className='font-bold uppercase text-stone-900'>NGƯỜI ĐỀ NGHỊ</p>
                                    <p className='text-[11px] italic text-stone-500'>(Ký, ghi rõ họ tên)</p>
                                </div>
                                <p className='font-bold text-stone-900 pt-12'>{requesterName || '……………………………………………'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Xem trước tên file chuẩn */}
                    <div className='rounded-xl border border-orange-200/80 bg-orange-50/50 p-3 space-y-1.5'>
                        <div className='flex items-center gap-2 text-xs font-semibold text-orange-900'>
                            <Sparkles size={14} className='text-orange-500' />
                            <span>Tên file Word chuẩn Getvini sinh ra:</span>
                        </div>
                        <p className='font-mono text-xs font-bold text-orange-700 bg-white p-2 rounded-lg border border-orange-200 break-all select-all'>
                            {standardDisplayFormula}
                        </p>
                        <p className='text-[11px] text-stone-500'>
                            Tên tệp khi lưu / tải về máy: <span className='font-mono font-medium text-stone-700'>{safeDownloadFileName}</span>
                        </p>
                    </div>

                    {successMessage && (
                        <p className='flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 border border-emerald-200'>
                            <CheckCircle size={14} className='shrink-0' /> {successMessage}
                        </p>
                    )}

                    {error && (
                        <p className='flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 border border-red-200'>
                            <AlertCircle size={14} className='shrink-0' /> {error}
                        </p>
                    )}
                </div>
            )}

            {/* Footer buttons */}
            <div className='flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-stone-50/60 px-5 py-3 sm:px-6'>
                <div className='flex items-center gap-2'>
                    {viewMode === 'PREVIEW' ? (
                        <button
                            type='button'
                            onClick={() => setViewMode('FORM')}
                            className={btnSecondary}
                        >
                            <ArrowLeft size={14} />
                            <span>Quay lại sửa</span>
                        </button>
                    ) : (
                        <button
                            type='button'
                            onClick={() => setViewMode('PREVIEW')}
                            className={btnSecondary}
                            title='Xem trước mẫu văn bản Word sẽ sinh ra'
                        >
                            <Eye size={14} className='text-orange-600' />
                            <span>Xem trước bản mẫu</span>
                        </button>
                    )}

                    <button
                        type='button'
                        onClick={handleDownloadTemplate}
                        disabled={isDownloading}
                        className={btnSecondary}
                        title='Tải file Word (.docx) về máy để chỉnh sửa offline'
                    >
                        {isDownloading ? <Loader2 size={14} className='animate-spin text-orange-600' /> : <Download size={14} />}
                        <span>{isDownloading ? 'Đang tạo...' : 'Tải file Word về máy để sửa'}</span>
                    </button>
                </div>

                <div className='flex items-center gap-2 ml-auto'>
                    <button type='button' onClick={onClose} className={btnSecondary}>
                        Đóng
                    </button>
                    <button
                        type='button'
                        onClick={handleGenerateAndApply}
                        disabled={isDownloading}
                        className={btnPrimary}
                        title='Đưa thông tin vào hồ sơ, hệ thống sẽ tự động xuất Word và tải lên Google Drive khi gửi yêu cầu'
                    >
                        <FileCheck size={15} />
                        <span>Đưa vào hồ sơ</span>
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};
