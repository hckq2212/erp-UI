import { Layers, Briefcase } from 'lucide-react';

export const ContractServices = ({ contractServices = [] }) => {
  // Group and aggregate services to avoid listing duplicate lines (since quantity is stored as multiple rows)
  const aggregated = contractServices.reduce((acc, item) => {
    const key = `${item.serviceId || item.id}_${item.isPackageService}_${item.packageName || ''}_${item.sellingPrice}`;
    if (!acc[key]) {
      acc[key] = {
        id: item.id,
        name: item.name || item.service?.name || 'Chưa xác định',
        sellingPrice: Number(item.sellingPrice || 0),
        isPackageService: !!item.isPackageService,
        packageName: item.packageName || null,
        quantity: 0
      };
    }
    acc[key].quantity += 1;
    return acc;
  }, {});

  const aggregatedList = Object.values(aggregated);

  // Split into standalone and package services
  const standaloneServices = aggregatedList.filter(item => !item.isPackageService);
  const packageServices = aggregatedList.filter(item => item.isPackageService);

  // Group package services by package name
  const packagesGrouped = packageServices.reduce((acc, item) => {
    const pkgName = item.packageName || 'Gói dịch vụ không tên';
    if (!acc[pkgName]) {
      acc[pkgName] = [];
    }
    acc[pkgName].push(item);
    return acc;
  }, {});

  // Calculate totals
  const totalStandalone = standaloneServices.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const totalPackages = packageServices.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const grandTotal = totalStandalone + totalPackages;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Chi Tiết Dịch Vụ Trong Hợp Đồng</h3>
          <p className="text-gray-500 text-xs mt-1">Danh sách dịch vụ đơn lẻ và gói dịch vụ liên kết</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Standalone Services Section */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold border-b border-gray-100 pb-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Dịch vụ đơn lẻ</span>
          </div>
          {standaloneServices.length > 0 ? (
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Tên dịch vụ</th>
                    <th className="px-6 py-3 text-center">Số lượng</th>
                    <th className="px-6 py-3 text-right">Đơn giá</th>
                    <th className="px-6 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {standaloneServices.map((item) => (
                    <tr key={item.id} className="bg-white hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-center">{item.quantity}</td>
                      <td className="px-6 py-4 text-right">{item.sellingPrice.toLocaleString('vi-VN')} đ</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">{(item.sellingPrice * item.quantity).toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic py-2 text-center bg-gray-50 rounded-lg">Không có dịch vụ đơn lẻ nào</p>
          )}
        </div>

        {/* Package Services Section */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold border-b border-gray-100 pb-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Gói dịch vụ</span>
          </div>
          {Object.keys(packagesGrouped).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(packagesGrouped).map(([packageName, items]) => {
                const packageSum = items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
                return (
                  <div key={packageName} className="border border-indigo-100 rounded-xl overflow-hidden shadow-sm bg-indigo-50/5">
                    <div className="bg-indigo-50/40 px-6 py-3 border-b border-indigo-100 flex justify-between items-center">
                      <span className="font-bold text-indigo-900">{packageName}</span>
                      {/* <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full">
                        Tổng gói: {packageSum.toLocaleString('vi-VN')} đ
                      </span> */}
                    </div>
                    <table className="w-full text-sm text-left text-gray-500 bg-white">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-2">Hạng mục dịch vụ</th>
                          <th className="px-6 py-2 text-center">Số lượng</th>
                          <th className="px-6 py-2 text-right">Đơn giá bổ trợ</th>
                          <th className="px-6 py-2 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/30">
                            <td className="px-6 py-3 text-gray-700 pl-8 relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                              {item.name}
                            </td>
                            <td className="px-6 py-3 text-center">{item.quantity}</td>
                            <td className="px-6 py-3 text-right">{item.sellingPrice.toLocaleString('vi-VN')} đ</td>
                            <td className="px-6 py-3 text-right font-medium text-gray-900">{(item.sellingPrice * item.quantity).toLocaleString('vi-VN')} đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic py-2 text-center bg-gray-50 rounded-lg">Không có gói dịch vụ nào</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 self-end">
        <div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Tổng giá trị dịch vụ</div>
          <div className="text-xl font-extrabold text-blue-600">{grandTotal.toLocaleString('vi-VN')} đ</div>
        </div>
      </div>
    </div>
  );
};
