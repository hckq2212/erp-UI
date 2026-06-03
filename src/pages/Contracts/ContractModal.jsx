import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCreateContractMutation } from '../../api/contracts';
import { useGetCustomersQuery } from '../../api/customers';
import { useGetReferralPartnersQuery } from '../../api/referralPartners';
import { useGetServicesQuery } from '../../api/services';
import { useGetServicePackagesQuery } from '../../api/servicePackages';
import { formatNumber, parseNumber } from '../../utils/format';

export const ContractModal = ({ isOpen, onClose }) => {
  const [createContract, { isLoading: isCreating }] = useCreateContractMutation();
  const { data: customers = [], isLoading: isLoadingCustomers } = useGetCustomersQuery();
  const { data: referralPartners = [] } = useGetReferralPartnersQuery();
  const { data: servicesData } = useGetServicesQuery();
  const { data: packagesData } = useGetServicePackagesQuery();

  const services = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
  const packages = Array.isArray(packagesData) ? packagesData : (packagesData?.data || packagesData || []);

  // Contract basics
  const [contractName, setContractName] = useState('');
  const [description, setDescription] = useState('');

  // Customer state
  const [customerMode, setCustomerMode] = useState('EXISTING'); // EXISTING or POTENTIAL
  const [customerType, setCustomerType] = useState('DIRECT'); // DIRECT or REFERRAL
  const [selectedReferralPartner, setSelectedReferralPartner] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [leadInfo, setLeadInfo] = useState({
    leadName: '',
    leadPhone: '',
    leadEmail: '',
    leadAddress: '',
    leadTaxId: ''
  });

  const [isFetchingTax, setIsFetchingTax] = useState(false);

  // Services and packages selection
  const [selectedServices, setSelectedServices] = useState([]); // { serviceId, quantity, sellingPrice }
  const [selectedPackages, setSelectedPackages] = useState([]); // { servicePackageId, quantity }

  // Tax ID Auto-fill logic
  useEffect(() => {
    const fetchInfo = async () => {
      const cleanTaxId = leadInfo.leadTaxId?.replace(/[\s-]/g, '');
      if (isOpen && customerMode === 'POTENTIAL' && (cleanTaxId?.length === 10 || cleanTaxId?.length === 13)) {
        setIsFetchingTax(true);
        try {
          const { fetchTaxInfo } = await import('../../utils/tax');
          const data = await fetchTaxInfo(cleanTaxId);
          if (data) {
            setLeadInfo(prev => ({
              ...prev,
              leadName: data.name || prev.leadName,
              leadAddress: data.address || prev.leadAddress
            }));
            toast.info('Đã tự động điền thông tin doanh nghiệp');
          }
        } catch (err) {
          console.error('Tax fetch failed:', err);
        } finally {
          setIsFetchingTax(false);
        }
      }
    };

    const timer = setTimeout(fetchInfo, 500);
    return () => clearTimeout(timer);
  }, [leadInfo.leadTaxId, isOpen, customerMode]);

  if (!isOpen) return null;

  const handleAddService = () => {
    setSelectedServices(prev => [...prev, { serviceId: '', quantity: 1, sellingPrice: 0 }]);
  };

  const handleRemoveService = (index) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index, field, value) => {
    setSelectedServices(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };

      // Auto fill sellingPrice from service default costPrice if serviceId changed
      if (field === 'serviceId') {
        const found = services.find(s => s.id === value);
        if (found) {
          updated.sellingPrice = Number(found.costPrice || 0);
        }
      }
      return updated;
    }));
  };

  const handleAddPackage = () => {
    setSelectedPackages(prev => [...prev, { servicePackageId: '', quantity: 1 }]);
  };

  const handleRemovePackage = (index) => {
    setSelectedPackages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePackageChange = (index, field, value) => {
    setSelectedPackages(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'servicePackageId') {
        const found = packages.find(p => p.id === value);
        const customPrices = {};
        if (found && found.items) {
          found.items.forEach(pkgItem => {
            if (pkgItem.service) {
              customPrices[pkgItem.service.id] = Number(pkgItem.service.costPrice || 0);
            }
          });
        }
        updated.customPrices = customPrices;
        updated.isExpanded = true;
      }
      return updated;
    }));
  };

  const handlePackageCustomPriceChange = (packageIndex, serviceId, newPrice) => {
    setSelectedPackages(prev => prev.map((item, i) => {
      if (i !== packageIndex) return item;
      return {
        ...item,
        customPrices: {
          ...item.customPrices,
          [serviceId]: Number(newPrice) || 0
        }
      };
    }));
  };

  const togglePackageExpand = (index) => {
    setSelectedPackages(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, isExpanded: !item.isExpanded };
    }));
  };

  // Dynamic Price calculations
  const calculateTotal = () => {
    let serviceTotal = selectedServices.reduce((sum, item) => {
      return sum + (Number(item.sellingPrice || 0) * (item.quantity || 1));
    }, 0);

    let packageTotal = selectedPackages.reduce((sum, item) => {
      const pkg = packages.find(p => p.id === item.servicePackageId);
      if (!pkg) return sum;
      let pkgSum = 0;
      if (pkg.items) {
        pkgSum = pkg.items.reduce((itemSum, pkgItem) => {
          const service = pkgItem.service;
          if (!service) return itemSum;
          const price = item.customPrices?.[service.id] !== undefined
            ? item.customPrices[service.id]
            : Number(service.costPrice || 0);
          const qty = pkgItem.defaultQuantity || 1;
          return itemSum + (price * qty);
        }, 0);
      }
      return sum + (pkgSum * (item.quantity || 1));
    }, 0);

    return serviceTotal + packageTotal;
  };

  const getAvailableServices = (currentServiceId) => {
    return services.filter(s =>
      !selectedServices.some(sel => sel.serviceId === s.id && sel.serviceId !== currentServiceId)
    );
  };

  const getAvailablePackages = (currentPackageId) => {
    return packages.filter(p =>
      !selectedPackages.some(sel => sel.servicePackageId === p.id && sel.servicePackageId !== currentPackageId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contractName.trim()) {
      return toast.error('Vui lòng nhập tên hợp đồng');
    }

    if (customerMode === 'EXISTING' && !selectedCustomerId) {
      return toast.error('Vui lòng chọn khách hàng hiện hữu');
    }

    if (customerMode === 'POTENTIAL') {
      if (!leadInfo.leadName.trim()) return toast.error('Vui lòng nhập tên khách hàng tiềm năng');

      const phoneRegex = /^\+?[0-9]{10,15}$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const taxIdRegex = /^\d{10}(\s?-\s?\d{3})?$/;

      if (leadInfo.leadPhone && !phoneRegex.test(leadInfo.leadPhone)) return toast.error('Số điện thoại không hợp lệ');
      if (leadInfo.leadEmail && !emailRegex.test(leadInfo.leadEmail)) return toast.error('Email không hợp lệ');
      if (leadInfo.leadTaxId && !taxIdRegex.test(leadInfo.leadTaxId)) return toast.error('Mã số thuế không hợp lệ');
    }

    if (selectedServices.length === 0 && selectedPackages.length === 0) {
      return toast.error('Vui lòng thêm ít nhất một dịch vụ hoặc gói dịch vụ');
    }

    // Check if any service/package is empty
    if (selectedServices.some(s => !s.serviceId)) {
      return toast.error('Vui lòng chọn đầy đủ thông tin dịch vụ đơn lẻ');
    }
    if (selectedPackages.some(p => !p.servicePackageId)) {
      return toast.error('Vui lòng chọn đầy đủ thông tin gói dịch vụ');
    }

    const payload = {
      name: contractName,
      description,
      status: 'DRAFT', // Explicitly DRAFT
    };

    if (customerMode === 'EXISTING') {
      payload.customerId = selectedCustomerId;
    } else {
      payload.customerData = {
        name: leadInfo.leadName,
        phone: leadInfo.leadPhone,
        email: leadInfo.leadEmail,
        address: leadInfo.leadAddress,
        taxId: leadInfo.leadTaxId,
        customerType: customerType,
        source: customerType === 'REFERRAL' ? 'REFERRAL_PARTNER' : 'INTERNAL',
        referralPartnerId: customerType === 'REFERRAL' ? selectedReferralPartner : undefined,
        status: 'POTENTIAL'
      };
    }

    if (selectedServices.length > 0) {
      payload.services = selectedServices.map(s => ({
        serviceId: s.serviceId,
        quantity: Number(s.quantity),
        sellingPrice: Number(s.sellingPrice)
      }));
    }

    if (selectedPackages.length > 0) {
      payload.packages = selectedPackages.map(p => ({
        servicePackageId: p.servicePackageId,
        quantity: Number(p.quantity),
        customPrices: p.customPrices
      }));
    }

    try {
      await createContract(payload).unwrap();
      toast.success('Tạo hợp đồng thành công!');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo hợp đồng');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Tạo Hợp Đồng Mới</h3>
            <p className="text-gray-500 text-xs mt-1">Hợp đồng sẽ được khởi tạo dưới trạng thái DRAFT</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Thông tin chung */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">1. Thông tin chung</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên hợp đồng <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="Nhập tên hợp đồng"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả hợp đồng"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Thông tin Khách hàng */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">2. Khách hàng</h4>

            {/* Chế độ chọn khách hàng */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="customerMode"
                  checked={customerMode === 'EXISTING'}
                  onChange={() => setCustomerMode('EXISTING')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Khách hàng hiện hữu</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="customerMode"
                  checked={customerMode === 'POTENTIAL'}
                  onChange={() => setCustomerMode('POTENTIAL')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Tạo khách hàng tiềm năng mới</span>
              </label>
            </div>

            {customerMode === 'EXISTING' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn khách hàng <span className="text-red-500">*</span></label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.taxId ? `(${c.taxId})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại khách hàng</label>
                    <select
                      value={customerType}
                      onChange={(e) => {
                        setCustomerType(e.target.value);
                        setSelectedReferralPartner('');
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="DIRECT">Khách hàng trực tiếp</option>
                      <option value="REFERRAL">Khách hàng liên kết</option>
                    </select>
                  </div>

                  {customerType === 'REFERRAL' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Đối tác giới thiệu</label>
                      <select
                        value={selectedReferralPartner}
                        onChange={(e) => setSelectedReferralPartner(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Chọn đối tác</option>
                        {referralPartners.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                    <input
                      type="text"
                      value={leadInfo.leadTaxId}
                      onChange={(e) => setLeadInfo({ ...leadInfo, leadTaxId: e.target.value })}
                      placeholder="Nhập mã số thuế để tự điền"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={leadInfo.leadName}
                      onChange={(e) => setLeadInfo({ ...leadInfo, leadName: e.target.value })}
                      placeholder={isFetchingTax ? "Đang lấy thông tin..." : "Tên công ty/khách hàng"}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
                    <input
                      type="text"
                      value={leadInfo.leadPhone}
                      onChange={(e) => setLeadInfo({ ...leadInfo, leadPhone: e.target.value })}
                      placeholder="Số điện thoại liên hệ"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={leadInfo.leadEmail}
                      onChange={(e) => setLeadInfo({ ...leadInfo, leadEmail: e.target.value })}
                      placeholder="Địa chỉ email"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <textarea
                    value={leadInfo.leadAddress}
                    onChange={(e) => setLeadInfo({ ...leadInfo, leadAddress: e.target.value })}
                    placeholder="Địa chỉ trụ sở"
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dịch vụ & Gói dịch vụ */}
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">3. Dịch vụ & Gói dịch vụ</h4>

            {/* Render Dịch vụ đơn lẻ */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Dịch vụ đơn lẻ</div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm dịch vụ lẻ
                </button>
              </div>

              {selectedServices.length > 0 ? (
                <div className="space-y-3">
                  {selectedServices.map((item, index) => {
                    const availableServices = getAvailableServices(item.serviceId);
                    return (
                      <div key={index} className="flex gap-3 items-end bg-gray-50/30 p-3 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Tên dịch vụ</label>
                          <select
                            value={item.serviceId}
                            onChange={(e) => handleServiceChange(index, 'serviceId', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">-- Chọn dịch vụ --</option>
                            {availableServices.map(s => (
                              <option key={s.id} value={s.id}>{s.name} - Giá: {Number(s.costPrice).toLocaleString('vi-VN')} đ</option>
                            ))}
                          </select>
                        </div>

                        <div className="w-24">
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Số lượng</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleServiceChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="w-36">
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Đơn giá bán</label>
                          <input
                            type="text"
                            value={formatNumber(item.sellingPrice)}
                            onChange={(e) => handleServiceChange(index, 'sellingPrice', parseNumber(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveService(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs italic">
                  Chưa có dịch vụ đơn lẻ nào được chọn
                </div>
              )}
            </div>

            {/* Render Gói dịch vụ */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">Gói dịch vụ</div>
                <button
                  type="button"
                  onClick={handleAddPackage}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm gói dịch vụ
                </button>
              </div>

              {selectedPackages.length > 0 ? (
                <div className="space-y-4">
                  {selectedPackages.map((item, index) => {
                    const availablePackages = getAvailablePackages(item.servicePackageId);
                    const pkg = packages.find(p => p.id === item.servicePackageId);
                    const showExpand = !!(pkg && pkg.items && pkg.items.length > 0);
                    return (
                      <div key={index} className="bg-indigo-50/10 rounded-lg border border-indigo-100/50 overflow-hidden shadow-sm">
                        <div className="flex gap-3 items-end p-3 bg-white border-b border-indigo-50">
                          <div className="flex-1">
                            <label className="block text-[11px] font-medium text-indigo-600 mb-1">Tên gói dịch vụ</label>
                            <select
                              value={item.servicePackageId}
                              onChange={(e) => handlePackageChange(index, 'servicePackageId', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="">-- Chọn gói dịch vụ --</option>
                              {availablePackages.map(p => (
                                <option key={p.id} value={p.id}>{p.name} - Giá mặc định: {Number(p.price).toLocaleString('vi-VN')} đ</option>
                              ))}
                            </select>
                          </div>

                          <div className="w-24">
                            <label className="block text-[11px] font-medium text-indigo-600 mb-1">Số lượng gói</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handlePackageChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div className="flex gap-1.5 pb-0.5">
                            {showExpand && (
                              <button
                                type="button"
                                onClick={() => togglePackageExpand(index)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center border border-indigo-100"
                                title="Xem chi tiết dịch vụ trong gói"
                              >
                                {item.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePackage(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center border border-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Nested Services */}
                        {showExpand && item.isExpanded && (
                          <div className="bg-indigo-50/20 p-3 border-t border-indigo-50 space-y-2">
                            <div className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase mb-2">Cấu hình giá các dịch vụ trong gói</div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left bg-white rounded-lg border border-indigo-100 overflow-hidden shadow-sm">
                                <thead className="bg-indigo-50/40 text-indigo-800 text-[10px] uppercase font-bold tracking-wider border-b border-indigo-100">
                                  <tr>
                                    <th className="px-3 py-2">Tên dịch vụ</th>
                                    <th className="px-3 py-2 text-center w-24">Số lượng</th>
                                    <th className="px-3 py-2 text-right w-36">Đơn giá bán lẻ</th>
                                    <th className="px-3 py-2 text-right w-36">Tổng tiền</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {pkg.items.map((pkgItem) => {
                                    const service = pkgItem.service;
                                    if (!service) return null;
                                    const defaultQty = pkgItem.defaultQuantity || 1;
                                    const totalQty = defaultQty * (item.quantity || 1);
                                    const currentPrice = item.customPrices?.[service.id] !== undefined
                                      ? item.customPrices[service.id]
                                      : Number(service.costPrice || 0);
                                    const totalCost = totalQty * currentPrice;

                                    return (
                                      <tr key={service.id} className="hover:bg-indigo-50/10 transition-colors">
                                        <td className="px-3 py-2 font-medium text-gray-700 align-middle">
                                          {service.name}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-500 align-middle whitespace-nowrap">
                                          {totalQty} {service?.unit || 'dịch vụ'}
                                        </td>
                                        <td className="px-3 py-2 text-right align-middle">
                                          <div className="inline-flex items-center gap-1.5 justify-end">
                                            <input
                                              type="text"
                                              value={formatNumber(currentPrice)}
                                              onChange={(e) => handlePackageCustomPriceChange(index, service.id, parseNumber(e.target.value))}
                                              className="w-28 px-2 py-1 border border-gray-300 rounded text-right text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <span className="text-gray-400">đ</span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 text-right align-middle text-indigo-600 font-bold whitespace-nowrap">
                                          {totalCost.toLocaleString('vi-VN')} đ
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 bg-indigo-50/5 rounded-xl border border-dashed border-indigo-200/50 text-indigo-400/60 text-xs italic">
                  Chưa có gói dịch vụ nào được chọn
                </div>
              )}
            </div>

            {selectedServices.length === 0 && selectedPackages.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm">
                Chưa có dịch vụ nào được chọn. Vui lòng bấm thêm dịch vụ đơn lẻ hoặc gói dịch vụ ở trên.
              </div>
            )}
          </div>
        </form>

        {/* Footer & Total Price */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div>
            <div className="text-xs text-gray-500 font-semibold">TỔNG GIÁ TRỊ TẠM TÍNH</div>
            <div className="text-xl font-bold text-blue-600">{calculateTotal().toLocaleString('vi-VN')} đ</div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Đang tạo...' : 'Tạo hợp đồng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
