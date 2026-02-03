import React from 'react';
import { FileText, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

export const ContractAddendums = ({ addendums = [] }) => {
    if (!addendums || addendums.length === 0) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Phụ lục hợp đồng</h3>
                        <p className="text-sm text-gray-500">Danh sách các hạng mục phát sinh đã ký phụ lục</p>
                    </div>
                </div>
                <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                    {addendums.length} Phụ lục
                </div>
            </div>

            <div className="p-6 space-y-4">
                {addendums.map((addendum) => {
                    const sellingPrice = parseFloat(addendum.sellingPrice || 0);
                    const cost = parseFloat(addendum.cost || 0);
                    const profit = sellingPrice - cost;
                    const profitMargin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : 0;

                    return (
                        <div
                            key={addendum.id}
                            className="p-5 border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-md transition-all group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                        {addendum.name}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(addendum.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                {addendum.description && (
                                    <p className="text-sm text-gray-500 italic max-w-md">{addendum.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Giá trị phụ lục</p>
                                    <p className="text-lg font-black text-blue-600">{formatCurrency(sellingPrice)}</p>
                                </div>
                                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Giá vốn</p>
                                    <p className="text-lg font-bold text-gray-700">{formatCurrency(cost)}</p>
                                </div>
                                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Lợi nhuận</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-lg font-black text-purple-700">{formatCurrency(profit)}</p>
                                        <span className="text-xs font-bold text-purple-500">({profitMargin}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
