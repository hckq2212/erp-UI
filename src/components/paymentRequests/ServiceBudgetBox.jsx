import {
    Loader2, HelpCircle, Layers, AlertTriangle, AlertCircle, ShieldCheck, Info
} from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';
import { inputCls } from './paymentRequestConfig';

// Component Box Đối Soát Ngân Sách Dịch Vụ 2 Tầng (Hạng mục công việc vs Tổng nhóm dịch vụ dự án)
// Dùng chung cho cả Form Tạo/Sửa (chế độ nhập) và Modal Chi Tiết Phê Duyệt (chế độ readOnly cho Sale & BOD)
export const ServiceBudgetBox = ({
    budgetInfo,
    isLoading,
    amount,
    overBudgetReason,
    setOverBudgetReason,
    readOnly = false,
    isInSection = false
}) => {
    if (isLoading) {
        return (
            <div className="rounded-xl border border-gray-100 bg-orange-50/40 p-3.5 text-xs text-stone-500 flex items-center gap-2">
                <Loader2 size={15} className="animate-spin text-orange-500 shrink-0" />
                <span>Đang kiểm tra dữ liệu ngân sách dịch vụ dự án...</span>
            </div>
        );
    }

    if (!budgetInfo || !budgetInfo.hasService) {
        return (
            <div className="space-y-2">
                <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-xs text-stone-500 flex items-center gap-2">
                    <HelpCircle size={15} className="text-stone-400 shrink-0" />
                    <span>Công việc này chưa liên kết với dịch vụ hợp đồng dự án (không kiểm soát hạn mức).</span>
                </div>
                {overBudgetReason && (
                    <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-red-800">
                            <AlertTriangle size={14} className="text-red-600 shrink-0" />
                            <span>Lý do chi vượt ngân sách (Người tạo giải trình):</span>
                        </div>
                        <p className="text-red-900 bg-white/90 rounded-lg p-2.5 border border-red-100 font-medium whitespace-pre-line">
                            {overBudgetReason}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    const {
        serviceName,
        itemServiceName,
        hasItemBudget,
        itemBudget = 0,
        itemSpent = 0,
        remainingItemBudget = 0,
        hasTotalServiceBudget,
        totalServiceBudget = 0,
        totalServiceSpent = 0,
        remainingTotalServiceBudget = 0
    } = budgetInfo;

    const numAmount = Number(amount) || 0;

    // Kiểm tra xem dữ liệu 2 tầng có trùng khớp nhau không (để tránh hiển thị 2 cột số liệu giống hệt nhau)
    const isSameBudgetTier = Boolean(
        hasItemBudget &&
        hasTotalServiceBudget &&
        itemBudget === totalServiceBudget &&
        itemSpent === totalServiceSpent &&
        remainingItemBudget === remainingTotalServiceBudget
    );
    const isSingleTier = !hasTotalServiceBudget || !hasItemBudget || isSameBudgetTier;

    let level = 1;
    let statusText = '';
    let levelTone = 'safe';

    if (!hasTotalServiceBudget && !hasItemBudget) {
        level = 0;
        levelTone = 'neutral';
        statusText = 'Dịch vụ chưa thiết lập hạn mức ngân sách trong hợp đồng (Không giới hạn).';
    } else if (hasTotalServiceBudget && remainingTotalServiceBudget <= 0) {
        level = 3;
        levelTone = 'danger';
        const overTotal = numAmount + Math.abs(remainingTotalServiceBudget);
        statusText = `VƯỢT TOÀN BỘ NGÂN SÁCH DỊCH VỤ DỰ ÁN ${formatNumber(overTotal)} đ (Quỹ tổng dự án đã hết hoặc âm). Bắt buộc nhập lý do giải trình.`;
    } else if (hasTotalServiceBudget && remainingTotalServiceBudget > 0) {
        if (numAmount > remainingTotalServiceBudget) {
            level = 3;
            levelTone = 'danger';
            const overTotal = numAmount - remainingTotalServiceBudget;
            statusText = `VƯỢT TOÀN BỘ NGÂN SÁCH DỊCH VỤ DỰ ÁN ${formatNumber(overTotal)} đ. Bắt buộc nhập lý do giải trình.`;
        } else if (hasItemBudget && numAmount > remainingItemBudget) {
            level = 2;
            levelTone = 'warning';
            const overItem = numAmount - remainingItemBudget;
            const leftInTotal = remainingTotalServiceBudget - numAmount;
            statusText = `Vượt hạn mức hạng mục này ${formatNumber(overItem)} đ, nhưng tổng dự án vẫn còn dư ${formatNumber(leftInTotal)} đ (Có thể điều chuyển bù trừ nội bộ).`;
        } else {
            level = 1;
            levelTone = 'safe';
            statusText = numAmount > 0
                ? 'Khoản chi nằm trong hạn mức an toàn của hạng mục và tổng dịch vụ dự án.'
                : 'Hạn mức ngân sách khả dụng an toàn.';
        }
    } else if (hasItemBudget) {
        if (numAmount > remainingItemBudget) {
            level = 2;
            levelTone = 'warning';
            statusText = `Vượt hạn mức hạng mục này ${formatNumber(numAmount - remainingItemBudget)} đ.`;
        } else {
            level = 1;
            levelTone = 'safe';
            statusText = 'Nằm trong hạn mức hạng mục này.';
        }
    }

    return (
        <div className={cn(
            isInSection
                ? 'space-y-3'
                : 'rounded-xl border border-gray-200 bg-gradient-to-b from-orange-50/50 to-white p-3.5 space-y-3 shadow-xs'
        )}>
            {/* Tiêu đề Box chỉ hiện khi đứng độc lập (không nằm trong thẻ Section) */}
            {!isInSection && (
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                        <Layers size={14} className="text-orange-500" />
                        <span>Đối soát ngân sách dịch vụ</span>
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium">Dịch vụ: {serviceName || 'Chung'}</span>
                </div>
            )}

            {/* Hiển thị ngân sách: nếu 2 tầng giống nhau (hoặc chỉ có 1 tầng) thì gom 1 khối gọn gàng, tránh nhân đôi 2 cột giống hệt nhau */}
            {isSingleTier ? (
                <div className="rounded-lg border border-stone-200/80 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-800 text-xs truncate" title={serviceName || itemServiceName}>
                            Dịch vụ: <span className="text-orange-600 font-bold">{serviceName || itemServiceName || 'Chung'}</span>
                        </span>
                        <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-normal">
                            {isSameBudgetTier
                                ? 'Hạn mức toàn dự án'
                                : hasItemBudget
                                    ? 'Hạn mức hạng mục'
                                    : 'Tổng quỹ dịch vụ'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-stone-100 text-xs">
                        <div className="p-2 bg-stone-50/80 rounded-md border border-stone-100">
                            <span className="text-[11px] text-stone-400 block">Hạn mức ngân sách</span>
                            <span className="font-semibold text-xs text-stone-800 mt-0.5 block">
                                {formatNumber(hasItemBudget ? itemBudget : totalServiceBudget)} đ
                            </span>
                        </div>
                        <div className="p-2 bg-stone-50/80 rounded-md border border-stone-100">
                            <span className="text-[11px] text-stone-400 block">Đã cam kết chi</span>
                            <span className="font-semibold text-xs text-stone-700 mt-0.5 block">
                                {formatNumber(hasItemBudget ? itemSpent : totalServiceSpent)} đ
                            </span>
                        </div>
                        <div className="p-2 bg-stone-50/80 rounded-md border border-stone-100">
                            <span className="text-[11px] text-stone-400 block">Còn lại khả dụng</span>
                            {(() => {
                                const rem = hasTotalServiceBudget ? remainingTotalServiceBudget : remainingItemBudget;
                                return (
                                    <span className={cn(
                                        'font-bold text-xs mt-0.5 block',
                                        rem < 0 ? 'text-red-600' : 'text-emerald-700'
                                    )}>
                                        {rem < 0 ? `Vượt ${formatNumber(Math.abs(rem))} đ` : `${formatNumber(rem)} đ`}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            ) : (
                /* Trường hợp 2 tầng có dữ liệu và phạm vi khác nhau */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Tầng 1: Hạng mục cụ thể */}
                    <div className="rounded-lg border border-stone-200/80 bg-white p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-700 truncate" title={itemServiceName}>
                                Quỹ dịch vụ: {itemServiceName || 'Dịch vụ này'}
                            </span>
                            {/* <span className="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">Tầng 1</span> */}
                        </div>
                        {hasItemBudget ? (
                            <div className="space-y-0.5 text-[11px] text-stone-600">
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Hạn mức:</span>
                                    <span className="font-semibold text-stone-800">{formatNumber(itemBudget)} đ</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Đã cam kết chi:</span>
                                    <span className="text-stone-700">{formatNumber(itemSpent)} đ</span>
                                </div>
                                <div className="flex justify-between pt-0.5 border-t border-stone-100 font-medium">
                                    <span className="text-stone-500">Còn lại:</span>
                                    <span className={remainingItemBudget < 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                                        {remainingItemBudget < 0 ? `Đã vượt ${formatNumber(Math.abs(remainingItemBudget))} đ` : `${formatNumber(remainingItemBudget)} đ`}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[11px] text-stone-400 italic">Chưa đặt hạn mức riêng</p>
                        )}
                    </div>

                    {/* Tầng 2: Tổng nhóm dịch vụ dự án */}
                    <div className="rounded-lg border border-stone-200/80 bg-white p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-700 truncate" title={serviceName}>
                                Tổng quỹ dịch vụ {serviceName || 'dịch vụ'} (Dự án)
                            </span>
                            {/* <span className="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">Tầng 2</span> */}
                        </div>
                        {hasTotalServiceBudget ? (
                            <div className="space-y-0.5 text-[11px] text-stone-600">
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Tổng ngân sách:</span>
                                    <span className="font-semibold text-stone-800">{formatNumber(totalServiceBudget)} đ</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Tổng đã cam kết:</span>
                                    <span className="text-stone-700">{formatNumber(totalServiceSpent)} đ</span>
                                </div>
                                <div className="flex justify-between pt-0.5 border-t border-stone-100 font-medium">
                                    <span className="text-stone-500">Còn lại dự án:</span>
                                    <span className={remainingTotalServiceBudget < 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                                        {remainingTotalServiceBudget < 0 ? `Đã vượt ${formatNumber(Math.abs(remainingTotalServiceBudget))} đ` : `${formatNumber(remainingTotalServiceBudget)} đ`}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[11px] text-stone-400 italic">Không giới hạn ngân sách tổng hợp đồng</p>
                        )}
                    </div>
                </div>
            )}

            {/* Thông báo đánh giá tác động thời gian thực */}
            <div className={cn(
                'rounded-lg p-2.5 text-xs flex items-start gap-2 transition',
                levelTone === 'danger' && 'bg-red-50 text-red-800 border border-red-200',
                levelTone === 'warning' && 'bg-amber-50 text-amber-900 border border-amber-200',
                levelTone === 'safe' && 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                levelTone === 'neutral' && 'bg-stone-50 text-stone-600 border border-stone-200'
            )}>
                {levelTone === 'danger' && <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />}
                {levelTone === 'warning' && <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />}
                {levelTone === 'safe' && <ShieldCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />}
                {levelTone === 'neutral' && <Info size={15} className="text-stone-400 shrink-0 mt-0.5" />}
                <div className="min-w-0 flex-1 leading-snug">
                    <p className="font-semibold">{statusText}</p>
                </div>
            </div>

            {/* Hiển thị lý do chi vượt ngân sách */}
            {readOnly ? (
                overBudgetReason && (
                    <div className="space-y-1 pt-1 border-t border-red-100">
                        <label className="text-xs font-bold text-red-700 flex items-center gap-1">
                            <AlertTriangle size={13} className="text-red-600 shrink-0" />
                            <span>Lý do chi vượt ngân sách (Người tạo giải trình):</span>
                        </label>
                        <div className="rounded-lg border border-red-200 bg-red-50/70 p-2.5 text-xs text-red-900 font-medium whitespace-pre-line">
                            {overBudgetReason}
                        </div>
                    </div>
                )
            ) : (
                (level === 3 || level === 2) && (
                    <div className="space-y-1 pt-1">
                        <label className="text-xs font-bold text-red-700 flex items-center gap-1">
                            Lý do chi vượt ngân sách {level === 3 ? <span className="text-red-500">*</span> : <span className="text-stone-400 font-normal">(tùy chọn)</span>}
                            <span className="font-normal text-[11px] text-stone-500">
                                {level === 3 ? '(Bắt buộc giải trình cho Admin Sale/BOD)' : '(Giải trình cho Admin Sale/BOD nếu cần)'}
                            </span>
                        </label>
                        <textarea
                            value={overBudgetReason || ''}
                            onChange={(e) => setOverBudgetReason?.(e.target.value)}
                            rows={2}
                            placeholder="Nêu rõ lý do phát sinh chi phí vượt dự toán dịch vụ dự án..."
                            className={cn(inputCls, 'border-red-300 bg-red-50/30 focus:border-red-500 focus:bg-white')}
                        />
                    </div>
                )
            )}
        </div>
    );
};
