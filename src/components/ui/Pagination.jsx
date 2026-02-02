import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-medium">
                        Hiển thị <span className="font-bold text-gray-900">{Math.min(totalItems, (currentPage - 1) * 10 + 1)}</span> đến{' '}
                        <span className="font-bold text-gray-900">{Math.min(totalItems, currentPage * 10)}</span> trong số{' '}
                        <span className="font-bold text-gray-900">{totalItems}</span> kết quả
                    </p>
                </div>
                <div>
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
                            {pages.map((page) => (
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
