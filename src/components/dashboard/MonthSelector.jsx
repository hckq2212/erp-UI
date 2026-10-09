import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown, Check, ChevronLeft, ChevronRight, Layers, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MonthSelector = ({ selectedDate, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Initial year based on selectedDate or current year
    const [viewYear, setViewYear] = useState(selectedDate?.year || new Date().getFullYear());

    // Drag-to-select state
    const [dragState, setDragState] = useState({
        isDragging: false,
        startMonth: null,
        hoverMonth: null,
    });

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setDragState({ isDragging: false, startMonth: null, hoverMonth: null });
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    // Keep viewYear synced with selectedDate if it changes externally
    useEffect(() => {
        if (selectedDate?.year) {
            setViewYear(selectedDate.year);
        }
    }, [selectedDate?.year]);

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
        'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
        'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    // Determine current selection
    const isAllTime = !selectedDate?.year && !selectedDate?.month && !selectedDate?.startMonth;
    const currentStart = selectedDate?.startMonth || selectedDate?.month || null;
    const currentEnd = selectedDate?.endMonth || selectedDate?.month || null;
    const isCurrentYear = selectedDate?.year === viewYear;

    // Active range calculation (either during drag or from current state)
    let activeMin = null;
    let activeMax = null;

    if (dragState.isDragging && dragState.startMonth !== null) {
        const target = dragState.hoverMonth !== null ? dragState.hoverMonth : dragState.startMonth;
        activeMin = Math.min(dragState.startMonth, target);
        activeMax = Math.max(dragState.startMonth, target);
    } else if (isCurrentYear && currentStart !== null && currentEnd !== null) {
        activeMin = Math.min(currentStart, currentEnd);
        activeMax = Math.max(currentStart, currentEnd);
    }

    // Apply selection
    const commitSelection = useCallback((startM, endM) => {
        const minM = Math.min(startM, endM);
        const maxM = Math.max(startM, endM);

        if (minM === maxM) {
            onChange({
                month: minM,
                startMonth: minM,
                endMonth: minM,
                year: viewYear
            });
        } else {
            onChange({
                month: null,
                startMonth: minM,
                endMonth: maxM,
                year: viewYear
            });
        }
    }, [onChange, viewYear]);

    // Mouse handlers for drag
    const handleMouseDown = (m, e) => {
        e.preventDefault();
        setDragState({
            isDragging: true,
            startMonth: m,
            hoverMonth: m,
        });
    };

    const handleMouseEnter = (m) => {
        if (dragState.isDragging) {
            setDragState(prev => ({
                ...prev,
                hoverMonth: m,
            }));
        }
    };

    const handleMouseUp = (m) => {
        if (dragState.isDragging && dragState.startMonth !== null) {
            const endM = m || dragState.hoverMonth || dragState.startMonth;
            commitSelection(dragState.startMonth, endM);
            setDragState({ isDragging: false, startMonth: null, hoverMonth: null });
        }
    };

    // Global mouseup to catch mouse releases outside month buttons
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (dragState.isDragging && dragState.startMonth !== null) {
                const endM = dragState.hoverMonth || dragState.startMonth;
                commitSelection(dragState.startMonth, endM);
                setDragState({ isDragging: false, startMonth: null, hoverMonth: null });
            }
        };

        if (dragState.isDragging) {
            window.addEventListener('mouseup', handleGlobalMouseUp);
            window.addEventListener('touchend', handleGlobalMouseUp);
        }

        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, [dragState, commitSelection]);

    // Touch support for dragging across months on mobile/touch screens
    const handleTouchMove = (e) => {
        if (!dragState.isDragging) return;
        const touch = e.touches[0];
        if (!touch) return;
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        const monthAttr = targetEl?.getAttribute('data-month-index');
        if (monthAttr) {
            const m = parseInt(monthAttr, 10);
            if (!isNaN(m) && m >= 1 && m <= 12) {
                setDragState(prev => ({ ...prev, hoverMonth: m }));
            }
        }
    };

    // Handle "Xem tất cả"
    const handleSelectAllTime = () => {
        onChange({ month: null, startMonth: null, endMonth: null, year: null });
        setIsOpen(false);
    };

    // Display text on the trigger button
    const getTriggerLabel = () => {
        if (isAllTime) {
            return 'Tất cả thời gian';
        }
        if (selectedDate?.startMonth && selectedDate?.endMonth && selectedDate.startMonth !== selectedDate.endMonth) {
            return `Tháng ${selectedDate.startMonth} - Tháng ${selectedDate.endMonth}, ${selectedDate.year}`;
        }
        if (selectedDate?.month || selectedDate?.startMonth) {
            return `Tháng ${selectedDate.month || selectedDate.startMonth}, ${selectedDate.year}`;
        }
        if (selectedDate?.year) {
            return `Cả năm ${selectedDate.year}`;
        }
        return 'Tất cả thời gian';
    };

    return (
        <div className="relative select-none" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-4 py-2 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all group ${
                    isOpen ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-100 hover:border-orange-200'
                }`}
                title="Chọn khoảng thời gian hoặc xem tất cả"
            >
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors shrink-0">
                    <Calendar className="w-4 h-4" />
                </div>
                <div className="text-left hidden md:block">
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">Thời gian</p>
                        {isAllTime ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider bg-orange-100 text-orange-700">
                                Tất cả
                            </span>
                        ) : selectedDate?.startMonth && selectedDate?.endMonth && selectedDate.startMonth !== selectedDate.endMonth ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                                Dải tháng
                            </span>
                        ) : null}
                    </div>
                    <p className="text-sm font-bold text-gray-900 leading-none">
                        {getTriggerLabel()}
                    </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl shadow-gray-300/50 border border-gray-100 p-4 z-50"
                        onTouchMove={handleTouchMove}
                    >
                        {/* Nút Xem Tất Cả - Nổi bật & Rõ ràng ở đầu */}
                        <div className="mb-3">
                            <button
                                type="button"
                                onClick={handleSelectAllTime}
                                className={`w-full py-2.5 px-3.5 rounded-2xl flex items-center justify-between transition-all group border ${
                                    isAllTime
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-md shadow-orange-200'
                                        : 'bg-orange-50/60 hover:bg-orange-500 text-orange-700 hover:text-white border-orange-200 hover:border-transparent shadow-xs'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                                        isAllTime ? 'bg-white/20 text-white' : 'bg-white text-orange-600 group-hover:bg-white/20 group-hover:text-white'
                                    }`}>
                                        <Layers className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-xs font-black uppercase tracking-wider leading-tight">
                                            Xem tất cả thời gian
                                        </span>
                                        <span className={`block text-[10px] leading-tight font-medium ${
                                            isAllTime ? 'text-orange-100' : 'text-orange-600/80 group-hover:text-orange-100'
                                        }`}>
                                            Toàn bộ dữ liệu hệ thống
                                        </span>
                                    </div>
                                </div>
                                {isAllTime ? (
                                    <span className="flex items-center gap-1 text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        Đang chọn
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        Chọn ngay &rarr;
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center my-2">
                            <div className="flex-grow border-t border-gray-100"></div>
                            <span className="flex-shrink mx-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                Hoặc chọn theo tháng
                            </span>
                            <div className="flex-grow border-t border-gray-100"></div>
                        </div>

                        {/* Year Selector */}
                        <div className="flex items-center justify-between mb-3 px-1">
                            <button
                                type="button"
                                onClick={() => setViewYear(v => v - 1)}
                                className="p-2 hover:bg-orange-50 rounded-xl text-gray-400 hover:text-orange-600 transition-colors"
                                title="Năm trước"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="text-center">
                                <span className="font-black text-gray-900 text-sm tracking-tight">{viewYear}</span>
                                {activeMin !== null && activeMax !== null && isCurrentYear && (
                                    <p className="text-[10px] font-bold text-orange-600 leading-none mt-0.5">
                                        {activeMin === activeMax ? `Tháng ${activeMin}` : `Tháng ${activeMin} → Tháng ${activeMax}`}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewYear(v => v + 1)}
                                className="p-2 hover:bg-orange-50 rounded-xl text-gray-400 hover:text-orange-600 transition-colors"
                                title="Năm sau"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 12 Months Grid with Drag Selection */}
                        <div className="grid grid-cols-3 gap-y-2 gap-x-1.5 p-1 bg-gray-50/60 rounded-2xl border border-gray-100">
                            {months.map((name, index) => {
                                const m = index + 1;
                                const isStart = activeMin !== null && m === activeMin;
                                const isEnd = activeMax !== null && m === activeMax;
                                const isInRange = activeMin !== null && activeMax !== null && m >= activeMin && m <= activeMax;
                                const isSingle = isStart && isEnd;

                                let monthStyle = 'bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 rounded-xl font-medium border border-gray-100/70 hover:border-orange-200';

                                if (isSingle) {
                                    monthStyle = 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black shadow-md shadow-orange-300 rounded-xl border border-transparent scale-[1.02] z-10';
                                } else if (isStart) {
                                    monthStyle = 'bg-orange-500 text-white font-black rounded-l-xl rounded-r-none border border-orange-500 shadow-sm z-10';
                                } else if (isEnd) {
                                    monthStyle = 'bg-orange-500 text-white font-black rounded-r-xl rounded-l-none border border-orange-500 shadow-sm z-10';
                                } else if (isInRange) {
                                    monthStyle = 'bg-orange-100 text-orange-900 font-bold rounded-none border-y border-orange-200';
                                }

                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        data-month-index={m}
                                        onMouseDown={(e) => handleMouseDown(m, e)}
                                        onMouseEnter={() => handleMouseEnter(m)}
                                        onMouseUp={() => handleMouseUp(m)}
                                        onTouchStart={(e) => handleMouseDown(m, e)}
                                        onClick={() => {
                                            // Fallback standard click selection
                                            commitSelection(m, m);
                                            setIsOpen(false);
                                        }}
                                        className={`relative py-2.5 text-xs transition-all cursor-pointer flex flex-col items-center justify-center select-none ${monthStyle}`}
                                    >
                                        <span className="leading-tight">{name}</span>
                                        {isSingle && (
                                            <span className="w-1 h-1 rounded-full bg-white mt-0.5"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Helper Hint */}
                        <div className="mt-3 flex items-center justify-between px-1 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1 font-medium">
                                <Sparkles className="w-3 h-3 text-orange-500" />
                                Kéo chuột để chọn nhiều tháng liên tiếp
                            </span>
                            {(!isAllTime) && (
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="font-bold text-orange-600 hover:text-orange-700 transition-colors"
                                >
                                    Đóng
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
