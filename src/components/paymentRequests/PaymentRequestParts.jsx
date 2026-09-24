import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber, parseNumber } from '../../utils/format';
import { inputCls } from './paymentRequestConfig';

/**
 * Khung modal dùng chung cho luồng Yêu cầu thanh toán.
 * - Render qua portal vào <body> để không bị header/sidebar hay stacking context của layout che mất nút đóng.
 * - Đóng được bằng: nút X, phím Esc, bấm ra vùng nền tối.
 * - Header/footer cố định, chỉ phần thân cuộn -> nút X luôn nhìn thấy dù nội dung dài.
 */
export const ModalShell = ({ onClose, maxWidth = 'max-w-2xl', children }) => {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onCloseRef.current?.();
        };
        document.addEventListener('keydown', handleKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = prevOverflow;
        };
    }, []);

    return createPortal(
        <div
            className='fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/50 backdrop-blur-[2px] sm:items-center sm:p-4'
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onCloseRef.current?.();
            }}
            role='dialog'
            aria-modal='true'
        >
            <div
                className={cn(
                    'flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl',
                    maxWidth
                )}
            >
                {children}
            </div>
        </div>,
        document.body
    );
};

export const ModalHeader = ({ icon: Icon, title, subtitle, onClose, children }) => (
    <div className='shrink-0 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-5 py-4 sm:px-6'>
        <div className='flex items-start gap-3'>
            {Icon && (
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm'>
                    <Icon size={20} />
                </div>
            )}
            <div className='min-w-0 flex-1'>
                <h2 className='text-base font-semibold text-stone-800 sm:text-lg'>{title}</h2>
                {subtitle && <p className='mt-0.5 text-xs text-stone-500'>{subtitle}</p>}
                {children && <div className='mt-2 flex flex-wrap items-center gap-2'>{children}</div>}
            </div>
            <button
                type='button'
                onClick={onClose}
                aria-label='Đóng'
                className='-mr-1 shrink-0 rounded-lg p-2 text-stone-400 transition hover:bg-orange-100 hover:text-orange-700'
            >
                <X size={20} />
            </button>
        </div>
    </div>
);

export const StatusBadge = ({ label, tone }) => (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', tone?.badge || 'bg-stone-100 text-stone-600')}>
        <span className={cn('h-1.5 w-1.5 rounded-full', tone?.dot || 'bg-stone-400')} />
        {label}
    </span>
);

// Ô nhập số tiền có dấu chấm ngăn cách hàng nghìn. Cho phép xóa trống (không bị dính số "0").
export const AmountInput = ({ value, onChange, placeholder = '0', className }) => (
    <div className='relative'>
        <input
            type='text'
            inputMode='numeric'
            value={value === '' || value === null || value === undefined ? '' : formatNumber(value)}
            onChange={(e) => onChange(e.target.value.trim() === '' ? '' : parseNumber(e.target.value))}
            placeholder={placeholder}
            className={cn(inputCls, 'pr-12', className)}
        />
        <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400'>VNĐ</span>
    </div>
);
