import { useState, useRef } from 'react';
import { Printer, Check, Info, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { readMoneyToWords } from '../../utils/numberToWordsVi';
import { cn } from '../../utils/cn';
import { ModalShell, ModalHeader } from './PaymentRequestParts';
import { inputCls, labelCls, btnPrimary, btnSecondary } from './paymentRequestConfig';

const DEBIT_ACCOUNT_OPTIONS = [
    { value: '331', label: '331 - Thanh toán cho Nhà cung cấp / Vendor' },
    { value: '627', label: '627 - Chi phí sản xuất, dự án, dịch vụ' },
    { value: '642', label: '642 - Chi phí quản lý doanh nghiệp' },
    { value: '641', label: '641 - Chi phí bán hàng, tiếp thị' },
    { value: '141', label: '141 - Tạm ứng cho nhân viên' },
    { value: '333', label: '333 - Nộp Thuế & Ngân sách Nhà nước' },
    { value: '138', label: '138 - Chi phí / Phải thu khác' },
    { value: 'CUSTOM', label: 'Tự nhập mã tài khoản khác...' },
];

const CREDIT_ACCOUNT_OPTIONS = [
    { value: '1111', label: '1111 - Tiền mặt Việt Nam Đồng (VND)' },
    { value: '1112', label: '1112 - Tiền mặt Ngoại tệ (USD, EUR...)' },
    { value: 'CUSTOM', label: 'Tự nhập mã tài khoản khác...' },
];

export const CashVoucherModal = ({ request, initialVoucherInfo, onSave, onClose }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultAmount = Number(request?.amount || 0);

    // Tự động gợi ý TK Nợ thông minh theo loại nghiệp vụ
    const getDefaultDebitAccount = () => {
        if (initialVoucherInfo?.debitAccount) return initialVoucherInfo.debitAccount;
        if (request?.vendorId || request?.vendor) return '331';
        if (request?.projectId || request?.project) return '627';
        return '642';
    };

    const initialDebit = getDefaultDebitAccount();
    const isInitialDebitPreset = DEBIT_ACCOUNT_OPTIONS.some((o) => o.value === initialDebit);

    const initialCredit = initialVoucherInfo?.creditAccount || '1111';
    const isInitialCreditPreset = CREDIT_ACCOUNT_OPTIONS.some((o) => o.value === initialCredit);

    const [voucherNo, setVoucherNo] = useState(initialVoucherInfo?.voucherNo || `PC-${String(Date.now()).slice(-6)}`);
    const [bookNo, setBookNo] = useState(initialVoucherInfo?.bookNo || '01');
    const [createdDate, setCreatedDate] = useState(initialVoucherInfo?.createdDate || todayStr);
    const [receiverName, setReceiverName] = useState(
        initialVoucherInfo?.receiverName || request?.vendor?.name || request?.requester?.fullName || ''
    );
    const [receiverAddress, setReceiverAddress] = useState(initialVoucherInfo?.receiverAddress || '');
    const [reason, setReason] = useState(initialVoucherInfo?.reason || request?.content || '');
    const [amount, setAmount] = useState(initialVoucherInfo?.amount ?? defaultAmount);
    const [amountInWords, setAmountInWords] = useState(
        initialVoucherInfo?.amountInWords || readMoneyToWords(defaultAmount)
    );

    const [debitSelect, setDebitSelect] = useState(isInitialDebitPreset ? initialDebit : 'CUSTOM');
    const [customDebit, setCustomDebit] = useState(isInitialDebitPreset ? '' : initialDebit);

    const [creditSelect, setCreditSelect] = useState(isInitialCreditPreset ? initialCredit : 'CUSTOM');
    const [customCredit, setCustomCredit] = useState(isInitialCreditPreset ? '' : initialCredit);

    const defaultAttachmentCount = (request?.invoiceImages?.length || 0) + (request?.invoicePdfs?.length || 0) || 1;
    const [attachmentCount, setAttachmentCount] = useState(
        initialVoucherInfo?.attachmentCount ?? defaultAttachmentCount
    );

    const debitAccount = debitSelect === 'CUSTOM' ? customDebit || '627' : debitSelect;
    const creditAccount = creditSelect === 'CUSTOM' ? customCredit || '1111' : creditSelect;

    const handleAmountChange = (newVal) => {
        const num = Number(newVal) || 0;
        setAmount(num);
        setAmountInWords(readMoneyToWords(num));
    };

    const handleSave = () => {
        const info = {
            voucherNo,
            bookNo,
            createdDate,
            receiverName,
            receiverAddress,
            reason,
            amount: Number(amount),
            amountInWords,
            debitAccount,
            creditAccount,
            attachmentCount: Number(attachmentCount),
        };
        onSave(info);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const d = createdDate ? new Date(createdDate) : new Date();
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Phiếu Chi ${voucherNo}</title>
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body { font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.4; color: #000; margin: 0; padding: 20px; }
                    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                    .header-table td { vertical-align: top; }
                    .unit-info { font-size: 11pt; line-height: 1.3; }
                    .form-num { font-size: 10pt; text-align: right; line-height: 1.3; }
                    .form-num strong { font-size: 11pt; }
                    .title-section { text-align: center; margin: 15px 0 10px 0; }
                    .title { font-size: 18pt; font-weight: bold; margin: 0; text-transform: uppercase; }
                    .date-str { font-style: italic; font-size: 11pt; }
                    .voucher-meta { float: right; width: 220px; text-align: left; font-size: 11pt; margin-top: -30px; }
                    .voucher-meta p { margin: 2px 0; }
                    .content-section { clear: both; margin-top: 15px; }
                    .line-item { margin: 6px 0; display: flex; align-items: baseline; }
                    .line-label { min-width: 170px; font-size: 12pt; }
                    .line-dots { flex: 1; border-bottom: 1px dotted #555; padding-left: 5px; font-weight: 500; }
                    .sig-table { width: 100%; margin-top: 25px; border-collapse: collapse; text-align: center; page-break-inside: avoid; }
                    .sig-table td { vertical-align: top; width: 20%; padding: 4px; }
                    .sig-title { font-weight: bold; font-size: 11pt; margin-bottom: 2px; }
                    .sig-note { font-style: italic; font-size: 9.5pt; color: #444; }
                    .sig-space { height: 75px; }
                    .receipt-confirm { margin-top: 25px; font-size: 11pt; line-height: 1.5; page-break-inside: avoid; }
                    .footer-note { margin-top: 15px; font-size: 9pt; font-style: italic; color: #333; }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td style="width: 50%;" class="unit-info">
                            <strong>Đơn vị:</strong> ERP System<br/>
                            <strong>Địa chỉ:</strong> Việt Nam
                        </td>
                        <td style="width: 50%;" class="form-num">
                            <strong>Mẫu số 02 - TT</strong><br/>
                            <em>(Kèm theo Thông tư số 99/2025/TT-BTC<br/>ngày 27 tháng 10 năm 2025 của Bộ trưởng Bộ Tài chính)</em>
                        </td>
                    </tr>
                </table>

                <div class="title-section">
                    <h1 class="title">PHIẾU CHI</h1>
                    <div class="date-str">Ngày ${day} tháng ${month} năm ${year}</div>
                </div>

                <div class="voucher-meta">
                    <p>Quyển số: ${bookNo}</p>
                    <p>Số: <strong>${voucherNo}</strong></p>
                    <p>Nợ: <strong>${debitAccount}</strong></p>
                    <p>Có: <strong>${creditAccount}</strong></p>
                </div>

                <div class="content-section">
                    <div class="line-item"><span class="line-label">Họ và tên người nhận tiền:</span><span class="line-dots">${receiverName}</span></div>
                    <div class="line-item"><span class="line-label">Địa chỉ:</span><span class="line-dots">${receiverAddress || '—'}</span></div>
                    <div class="line-item"><span class="line-label">Lý do chi:</span><span class="line-dots">${reason}</span></div>
                    <div class="line-item"><span class="line-label">Số tiền:</span><span class="line-dots"><strong>${formatCurrency(amount)}</strong></span></div>
                    <div class="line-item"><span class="line-label">(Viết bằng chữ):</span><span class="line-dots"><em>${amountInWords}</em></span></div>
                    <div class="line-item"><span class="line-label">Kèm theo:</span><span class="line-dots">${attachmentCount} Chứng từ gốc</span></div>
                </div>

                <div style="text-align: right; margin-top: 15px; font-style: italic; font-size: 11pt;">
                    Ngày ${day} tháng ${month} năm ${year}
                </div>

                <table class="sig-table">
                    <tr>
                        <td>
                            <div class="sig-title">Giám đốc</div>
                            <div class="sig-note">(Ký, họ tên, đóng dấu)</div>
                            <div class="sig-space"></div>
                        </td>
                        <td>
                            <div class="sig-title">Kế toán trưởng</div>
                            <div class="sig-note">(Ký, họ tên)</div>
                            <div class="sig-space"></div>
                        </td>
                        <td>
                            <div class="sig-title">Thủ quỹ</div>
                            <div class="sig-note">(Ký, họ tên)</div>
                            <div class="sig-space"></div>
                        </td>
                        <td>
                            <div class="sig-title">Người lập phiếu</div>
                            <div class="sig-note">(Ký, họ tên)</div>
                            <div class="sig-space"></div>
                        </td>
                        <td>
                            <div class="sig-title">Người nhận tiền</div>
                            <div class="sig-note">(Ký, họ tên)</div>
                            <div class="sig-space"></div>
                            <div style="font-weight: 500;">${receiverName}</div>
                        </td>
                    </tr>
                </table>

                <div class="receipt-confirm">
                    <p>Đã nhận đủ số tiền (viết bằng chữ): ........................................................................................................................</p>
                    <p>+ Tỷ giá ngoại tệ (vàng bạc, đá quý): ....................................................................................................................</p>
                    <p>+ Số tiền quy đổi: .......................................................................................................................................................</p>
                    <p style="font-style: italic; font-size: 10pt;">(Liên gửi ra ngoài phải đóng dấu)</p>
                </div>

                <div class="footer-note">
                    <strong>Ghi chú:</strong> Tùy theo đặc điểm hoạt động sản xuất kinh doanh và yêu cầu quản lý của đơn vị mình, doanh nghiệp được xây dựng, thiết kế biểu mẫu chứng từ kế toán.
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <ModalShell onClose={onClose} maxWidth='max-w-xl'>
            <ModalHeader icon={FileText} title='Lập Phiếu Chi Tiền Mặt (Mẫu 02 - TT)' onClose={onClose} />
            <div className='flex-1 space-y-4 overflow-y-auto bg-stone-50/50 p-5 sm:p-6'>
                {/* Khối hướng dẫn chọn tài khoản kế toán */}
                <div className='flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900'>
                    <Info size={16} className='mt-0.5 shrink-0 text-blue-600' />
                    <div>
                        <p className='font-semibold text-blue-800'>Hướng dẫn chọn Tài khoản Kế toán (Mẫu 02-TT):</p>
                        <p className='mt-0.5 text-blue-700 leading-relaxed'>
                            • <strong>TK 331</strong>: Trả tiền cho Vendor / Nhà cung cấp.<br />
                            • <strong>TK 627</strong>: Chi phí dự án, dịch vụ, sản xuất.<br />
                            • <strong>TK 642</strong>: Chi phí quản lý doanh nghiệp.<br />
                            • <strong>TK 1111</strong>: Tiền mặt VNĐ xuất quỹ.
                        </p>
                    </div>
                </div>

                <div className='grid grid-cols-3 gap-3 rounded-lg border border-stone-200 bg-white p-3.5'>
                    <div>
                        <label className={labelCls}>Số phiếu chi <span className='text-red-500'>*</span></label>
                        <input type='text' value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Quyển số</label>
                        <input type='text' value={bookNo} onChange={(e) => setBookNo(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Ngày lập</label>
                        <input type='date' value={createdDate} onChange={(e) => setCreatedDate(e.target.value)} className={inputCls} />
                    </div>
                </div>

                {/* Khối chọn Định khoản Kế toán Nợ / Có */}
                <div className='grid grid-cols-1 gap-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3.5 sm:grid-cols-2'>
                    <div>
                        <label className={labelCls}>
                            Tài khoản Nợ (Chi phí / Đối tượng chi) <span className='text-red-500'>*</span>
                        </label>
                        <select
                            value={debitSelect}
                            onChange={(e) => setDebitSelect(e.target.value)}
                            className={inputCls}
                        >
                            {DEBIT_ACCOUNT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {debitSelect === 'CUSTOM' && (
                            <input
                                type='text'
                                value={customDebit}
                                onChange={(e) => setCustomDebit(e.target.value)}
                                placeholder='Nhập mã tài khoản Nợ (VD: 621, 622...)'
                                className={cn(inputCls, 'mt-2')}
                            />
                        )}
                    </div>
                    <div>
                        <label className={labelCls}>
                            Tài khoản Có (Tiền mặt xuất quỹ) <span className='text-red-500'>*</span>
                        </label>
                        <select
                            value={creditSelect}
                            onChange={(e) => setCreditSelect(e.target.value)}
                            className={inputCls}
                        >
                            {CREDIT_ACCOUNT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {creditSelect === 'CUSTOM' && (
                            <input
                                type='text'
                                value={customCredit}
                                onChange={(e) => setCustomCredit(e.target.value)}
                                placeholder='Nhập mã tài khoản Có khác...'
                                className={cn(inputCls, 'mt-2')}
                            />
                        )}
                    </div>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-3.5 space-y-3'>
                    <div>
                        <label className={labelCls}>Họ và tên người nhận tiền <span className='text-red-500'>*</span></label>
                        <input type='text' value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Địa chỉ người nhận</label>
                        <input type='text' value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} placeholder='VD: Công ty / Địa chỉ người nhận' className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Lý do chi <span className='text-red-500'>*</span></label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className={inputCls} />
                    </div>
                    <div className='grid grid-cols-3 gap-3'>
                        <div className='col-span-2'>
                            <label className={labelCls}>Số tiền chi (VNĐ) <span className='text-red-500'>*</span></label>
                            <input
                                type='number'
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Chứng từ gốc kèm</label>
                            <input
                                type='number'
                                value={attachmentCount}
                                onChange={(e) => setAttachmentCount(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Số tiền bằng chữ (Tự động đọc)</label>
                        <input type='text' value={amountInWords} onChange={(e) => setAmountInWords(e.target.value)} className={inputCls} />
                    </div>
                </div>
            </div>

            <div className='flex shrink-0 items-center justify-between border-t border-stone-200 bg-white px-5 py-3 sm:px-6'>
                <button type='button' onClick={handlePrint} className='inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100'>
                    <Printer size={15} /> In Phiếu Chi (Mẫu 02-TT)
                </button>
                <div className='flex items-center gap-2'>
                    <button type='button' onClick={onClose} className={btnSecondary}>Hủy</button>
                    <button type='button' onClick={handleSave} className={btnPrimary}>
                        <Check size={15} /> Hoàn tất lập phiếu
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};
