import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage = 10 }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const showEllipsisThreshold = 7;

        if (totalPages <= showEllipsisThreshold) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first page
            pages.push(1);

            const leftBoundary = Math.max(2, currentPage - 1);
            const rightBoundary = Math.min(totalPages - 1, currentPage + 1);

            if (leftBoundary > 2) {
                pages.push('...');
            }

            for (let i = leftBoundary; i <= rightBoundary; i++) {
                pages.push(i);
            }

            if (rightBoundary < totalPages - 1) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-t border-gray-100 flex-wrap gap-3">
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 shadow-2xs"
                >
                    Trước
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 shadow-2xs"
                >
                    Sau
                </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between flex-wrap gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">
                        Hiển thị <span className="font-bold text-gray-900">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> đến{' '}
                        <span className="font-bold text-gray-900">{Math.min(totalItems, currentPage * itemsPerPage)}</span> trong số{' '}
                        <span className="font-bold text-gray-900">{totalItems}</span> kết quả
                    </p>
                </div>
                <div className="overflow-x-auto max-w-full">
                    <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-gray-50/50 p-1" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-lg px-2 py-2 text-gray-400 hover:bg-white hover:text-blue-600 focus:z-20 disabled:opacity-30 transition-all font-bold"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <div className="flex gap-1 px-1">
                            {pages.map((page, index) => (
                                page === '...' ? (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="relative inline-flex items-center px-2 py-1.5 text-xs font-medium text-gray-400"
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        className={cn(
                                            "relative inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-black transition-all",
                                            currentPage === page
                                                ? "z-10 bg-blue-600 text-white shadow-md shadow-blue-100 scale-105"
                                                : "text-gray-500 hover:bg-white hover:text-blue-600"
                                        )}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-lg px-2 py-2 text-gray-400 hover:bg-white hover:text-blue-600 focus:z-20 disabled:opacity-30 transition-all font-bold"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};
