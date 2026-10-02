import { useEffect, useMemo, useRef } from 'react';
import { Download, Info, X } from 'lucide-react';
import { buildProductDescriptionDocument } from '../../../utils/productDescriptionDocument';

// Xem trước đúng tài liệu sẽ được lưu ra PDF. Bấm "Tải PDF" mở hộp thoại in của trình duyệt,
// chọn "Lưu dưới dạng PDF" (Save as PDF): file lưu ra giống hệt bản đang xem.
export const ProductDescriptionPdfPreview = ({ isOpen, onClose, title, projectName, items }) => {
    const iframeRef = useRef(null);

    const srcDoc = useMemo(
        () => (isOpen ? buildProductDescriptionDocument({ title, projectName, items }) : ''),
        [isOpen, title, projectName, items]
    );

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleDownload = () => {
        const frame = iframeRef.current?.contentWindow;
        if (!frame) return;
        frame.focus();
        frame.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true">
            <div className="flex h-full max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="flex shrink-0 flex-col gap-2 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-gray-900">{title || 'Xem trước PDF'}</h3>
                        <p className="mt-0.5 flex items-start gap-1.5 text-xs text-gray-500">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                            <span>Bấm Tải PDF, rồi chọn <b>Lưu dưới dạng PDF</b> ở mục Máy in. File lưu ra giống bản xem trước này.</span>
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                        >
                            <Download className="h-4 w-4" />
                            Tải PDF
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                            <X className="h-4 w-4" />
                            Đóng
                        </button>
                    </div>
                </div>
                <iframe
                    ref={iframeRef}
                    title="Xem trước PDF thông tin chuẩn sản phẩm"
                    srcDoc={srcDoc}
                    sandbox="allow-same-origin allow-modals"
                    className="min-h-0 w-full flex-1 bg-slate-300"
                />
            </div>
        </div>
    );
};

export default ProductDescriptionPdfPreview;
