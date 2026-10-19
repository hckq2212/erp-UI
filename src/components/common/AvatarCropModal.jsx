import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Minus, Plus, Check, RotateCw, RefreshCw, Loader2 } from 'lucide-react';

const CROP_DIAMETER = 260;

export const AvatarCropModal = ({
    isOpen,
    imageFile,
    title = "Chỉnh sửa ảnh đại diện",
    onClose,
    onCropComplete
}) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [baseSize, setBaseSize] = useState({ width: CROP_DIAMETER, height: CROP_DIAMETER });
    const [isProcessing, setIsProcessing] = useState(false);

    const imgRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!imageFile) {
            setImageSrc(null);
            return;
        }
        const url = URL.createObjectURL(imageFile);
        setImageSrc(url);
        setZoom(1);
        setRotation(0);
        setPan({ x: 0, y: 0 });

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [imageFile]);

    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        setPan({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);

        // Đảm bảo kích thước tối thiểu của ảnh phủ kín vòng tròn crop
        if (naturalWidth && naturalHeight) {
            if (naturalWidth >= naturalHeight) {
                const h = CROP_DIAMETER;
                const w = (CROP_DIAMETER * naturalWidth) / naturalHeight;
                setBaseSize({ width: w, height: h });
            } else {
                const w = CROP_DIAMETER;
                const h = (CROP_DIAMETER * naturalHeight) / naturalWidth;
                setBaseSize({ width: w, height: h });
            }
        }
    };

    // Xử lý kéo thả (Pan)
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch events for mobile/tablet
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - pan.x,
                y: e.touches[0].clientY - pan.y,
            });
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        setPan({
            x: e.touches[0].clientX - dragStart.x,
            y: e.touches[0].clientY - dragStart.y,
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleZoomChange = (newZoom) => {
        const clamped = Math.min(3, Math.max(1, parseFloat(newZoom.toFixed(2))));
        setZoom(clamped);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        handleZoomChange(zoom + delta);
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setPan({ x: 0, y: 0 });
    };

    // Tạo ảnh đã cắt bằng Canvas
    const handleConfirm = () => {
        if (!imgRef.current || isProcessing) return;

        const img = imgRef.current;
        const OUTPUT_SIZE = 512;
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        setIsProcessing(true);

        // Tỉ lệ scale giữa canvas output và vòng tròn crop hiển thị
        const scaleRatio = OUTPUT_SIZE / CROP_DIAMETER;
        const drawW = baseSize.width * zoom * scaleRatio;
        const drawH = baseSize.height * zoom * scaleRatio;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.save();

        // 1. Dời về tâm canvas
        ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
        // 2. Dời theo khoảng cách pan của người dùng
        ctx.translate(pan.x * scaleRatio, pan.y * scaleRatio);
        // 3. Xoay góc nếu người dùng bấm xoay
        ctx.rotate((rotation * Math.PI) / 180);
        // 4. Vẽ ảnh với kích thước thu phóng tương ứng
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setIsProcessing(false);
                return;
            }
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            const previewUrl = URL.createObjectURL(blob);
            try {
                if (onCropComplete) {
                    await onCropComplete(file, previewUrl);
                }
                onClose();
            } catch (err) {
                // Lỗi được xử lý qua toast bên ngoài
            } finally {
                setIsProcessing(false);
            }
        }, 'image/jpeg', 0.95);
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-black text-gray-900 tracking-tight">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Viewport & Crop area */}
                <div
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                    className="relative w-full h-[360px] bg-neutral-900 overflow-hidden flex items-center justify-center cursor-move select-none"
                >
                    {/* Ảnh nguồn */}
                    <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="Crop target"
                        onLoad={handleImageLoad}
                        draggable={false}
                        style={{
                            width: `${baseSize.width}px`,
                            height: `${baseSize.height}px`,
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                            transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                            userSelect: 'none',
                        }}
                        className="pointer-events-none select-none max-w-none max-h-none"
                    />

                    {/* Vòng tròn Crop Mask (Overlay tối xung quanh, vòng tròn cắt ở giữa) */}
                    <div
                        className="absolute inset-0 pointer-events-none flex items-center justify-center"
                    >
                        <div
                            style={{
                                width: `${CROP_DIAMETER}px`,
                                height: `${CROP_DIAMETER}px`,
                                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.7)',
                            }}
                            className="rounded-full border-2 border-white/80 shadow-2xl"
                        />
                    </div>
                </div>

                {/* Controls (Zoom & Rotate) */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleZoomChange(zoom - 0.2)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                            title="Thu nhỏ"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <button
                            type="button"
                            onClick={() => handleZoomChange(zoom + 0.2)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                            title="Phóng to"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleRotate}
                            className="p-2 ml-1 text-gray-500 hover:text-orange-600 hover:bg-white rounded-xl border border-gray-200 shadow-sm transition-all cursor-pointer"
                            title="Xoay ảnh 90°"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-white rounded-xl border border-gray-200 shadow-sm transition-all cursor-pointer"
                            title="Đặt lại vị trí ban đầu"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[11px] text-gray-400 text-center font-medium">
                        Kéo rê để điều chỉnh vị trí và thanh trượt để phóng to/thu nhỏ
                    </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-75 disabled:cursor-wait text-white font-black text-xs shadow-md shadow-orange-100 flex items-center gap-1.5 transition-all"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang cập nhật...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Áp dụng
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarCropModal;
