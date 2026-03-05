import { Briefcase, Package } from 'lucide-react';
import { formatNumber } from '../../../utils/format';

export const OpportunityServicesInfo = ({ opportunity }) => {
    const standaloneServices = opportunity.services?.filter(s => !s.opportunityPackageId) || [];
    const packages = opportunity.packages || [];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Dịch vụ & Gói dịch vụ</h2>
            </div>

            <div className="space-y-6">
                {/* Packages */}
                {packages.map((pkg) => (
                    <div key={pkg.id} className="bg-blue-50/40 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-blue-900">Gói: {pkg.name} <span className="text-blue-500 ml-2">x{pkg.quantity || 1}</span></h3>
                        </div>

                        <div className="space-y-2 ml-4 border-l-2 border-blue-100/50 pl-4">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">Số lượng dưới đây là định mức cho 1 gói:</p>
                            {pkg.services?.map((s) => (
                                <div key={s.id} className="flex justify-between items-center py-2 border-b border-blue-50/50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{s.service?.name}</p>
                                        <p className="text-xs text-gray-500">Số lượng: {((s.quantity || 1) / (pkg.quantity || 1)) % 1 === 0
                                            ? (s.quantity || 1) / (pkg.quantity || 1)
                                            : Number((s.quantity || 1) / (pkg.quantity || 1)).toFixed(2).replace(/\.?0+$/, '')} / Gói</p>
                                    </div>
                                    <p className="text-sm font-semibold text-blue-700">{formatNumber(s.sellingPrice)} VNĐ</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Standalone Services */}
                {standaloneServices.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Dịch vụ lẻ</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {standaloneServices.map((s) => (
                                <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{s.service?.name}</p>
                                        <p className="text-xs text-gray-500">Số lượng: {s.quantity}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">{formatNumber(s.sellingPrice)} VNĐ</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(!packages.length && !standaloneServices.length) && (
                    <p className="text-center text-gray-400 py-4 italic">Chưa có dịch vụ nào được chọn</p>
                )}
            </div>
        </div>
    );
};
