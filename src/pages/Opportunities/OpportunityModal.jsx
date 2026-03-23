import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Link as LinkIcon, Building2, FileText, MapPin, Calendar, Target, TrendingUp, Clock, Briefcase } from 'lucide-react';
import { useCreateOpportunityMutation } from '../../api/opportunities';
import { useGetServicesQuery } from '../../api/services';
import { useGetServicePackagesQuery } from '../../api/servicePackages';
import { uploadToCloudinary } from '../../utils/cloudinary';
import Select from 'react-select';
import { VIETNAM_PROVINCES } from '../../utils/provinces';
import { formatNumber, parseNumber, formatDate, parseDate } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

const FIELDS = [
  { value: '', label: '-- Chọn lĩnh vực --' },
  { value: 'CNTT', label: 'Công nghệ thông tin' },
  { value: 'XayDung', label: 'Xây dựng' },
  { value: 'SanXuat', label: 'Sản xuất' },
  { value: 'ThuongMai', label: 'Thương mại' },
  { value: 'DichVu', label: 'Dịch vụ' },
  { value: 'GiaoDuc', label: 'Giáo dục' },
  { value: 'YTe', label: 'Y tế' },
  { value: 'Khac', label: 'Khác' },
];

const PRIORITIES = [
  { value: 'Low', label: 'Thấp' },
  { value: 'Medium', label: 'Trung bình' },
  { value: 'High', label: 'Cao' },
];

const REGIONS = VIETNAM_PROVINCES;

const LINK_PLACEHOLDERS = [
  'https://drive.google.com/...',
  'https://www.facebook.com/...',
  'https://www.tiktok.com/...',
  'https://www.instagram.com/...',
  'https://www.youtube.com/...',
  'Trang web của khách hàng',
];

const ServiceItem = memo(({ item, index, availableServices, onServiceChange, onRemove, hasError }) => {
  const isUnselected = !item.serviceId && hasError;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isUnselected ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
      <select
        value={item.serviceId}
        onChange={(e) => onServiceChange(index, 'serviceId', e.target.value)}
        className={`flex-1 px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all ${isUnselected ? 'border-red-400' : 'border-gray-200'}`}
      >
        <option value="">-- Chọn dịch vụ --</option>
        {availableServices.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input
        type="number"
        value={item.quantity}
        onChange={(e) => onServiceChange(index, 'quantity', e.target.value)}
        min={1}
        className="w-20 px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-center transition-all"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
});

const LinkItem = memo(({ link, index, onLinkChange, onRemove, showRemove, placeholder }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 relative">
      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="url"
        value={link}
        onChange={(e) => onLinkChange(index, e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all"
      />
    </div>
    {showRemove && (
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    )}
  </div>
));

const FileItem = memo(({ file, index, onRemove, progress, isUploading }) => (
  <div className="flex flex-col bg-gray-50 rounded-xl border border-gray-200 group hover:bg-white hover:border-blue-300 transition-all">
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <FileText className="w-4 h-4" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
    {isUploading && progress > 0 && (
      <div className="px-3 pb-1">
        <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    )}
  </div>
));

const PackageItem = memo(({ pkg, index, availableServices, onRemove, onServiceChange, onRemoveService, onAddService, onQuantityChange }) => {
  return (
    <div className="bg-blue-50/40 border-2 border-blue-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900">{pkg.name}</h4>
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 opacity-70">Gói dịch vụ</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
            <input
              type="number"
              min="1"
              className="w-12 text-center font-bold text-blue-900 bg-transparent outline-none"
              value={pkg.quantity}
              onChange={(e) => onQuantityChange(index, e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export const OpportunityModal = ({ isOpen, onClose, onSuccess }) => {
  const [createOpportunity, { isLoading }] = useCreateOpportunityMutation();
  const { data: servicesData } = useGetServicesQuery();
  const services = useMemo(() => Array.isArray(servicesData) ? servicesData : (servicesData?.data || []), [servicesData]);

  const { data: packageTemplatesData } = useGetServicePackagesQuery();
  const packageTemplates = useMemo(() => Array.isArray(packageTemplatesData) ? packageTemplatesData : [], [packageTemplatesData]);

  const navigate = useNavigate();

  const fieldRefs = useRef({});

  const setFieldRef = (name) => (el) => {
    if (el) fieldRefs.current[name] = el;
  };

  const focusField = (name) => {
    const el = fieldRefs.current[name];
    if (!el) return;

    el.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    el.focus?.();
  };

  const FIELD_ORDER = [
    'name',
    'description',
    'field',
    'expectedRevenue',
    'budget',
    'startDate',
    'endDate',
    'durationMonths',
    'successChance',
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    field: '',
    expectedRevenue: 0,
    budget: 0,
    startDate: '',
    endDate: '',
    priority: 'Medium',
    successChance: 0,
    region: [],
    durationMonths: 1,
    customerRequirements: '',
  });



  const [selectedServices, setSelectedServices] = useState([
    { serviceId: '', quantity: 1 }
  ]);

  const [selectedPackages, setSelectedPackages] = useState([
    { servicePackageId: '', services: [], quantity: 1 }
  ]);

  const [documentLinks, setDocumentLinks] = useState(Array(LINK_PLACEHOLDERS.length).fill(''));
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const handlePackageTemplateChange = useCallback((index, templateId) => {
    if (!templateId) {
      setSelectedPackages(prev => {
        const updated = [...prev];
        updated[index] = { servicePackageId: '', services: [] };
        return updated;
      });
      return;
    }

    const template = packageTemplates.find(t => String(t.id) === String(templateId));
    if (!template) return;

    setSelectedPackages(prev => {
      const updated = [...prev];
      updated[index] = {
        servicePackageId: template.id,
        name: template.name,
        description: template.description || '',
        quantity: 1,
        services: (template.items || []).map(item => ({
          serviceId: item.service?.id || item.serviceId,
          quantity: item.defaultQuantity || 1,
          sellingPrice: item.service?.costPrice || 0
        }))
      };
      return updated;
    });
    // Clear services error
    setErrors(prev => prev.services ? { ...prev, services: null } : prev);
  }, [packageTemplates]);

  const addPackage = useCallback(() => {
    setSelectedPackages(prev => [...prev, { servicePackageId: '', services: [], quantity: 1 }]);
  }, []);

  const removePackage = useCallback((index) => {
    setSelectedPackages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handlePackageQuantityChange = useCallback((index, value) => {
    setSelectedPackages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: Number(value) || 1 };
      return updated;
    });
  }, []);

  const handlePackageServiceChange = useCallback((pkgIndex, sIndex, field, value) => {
    setSelectedPackages(prev => {
      const updated = [...prev];
      const pkg = { ...updated[pkgIndex] };
      const pkgServices = [...pkg.services];
      pkgServices[sIndex] = { ...pkgServices[sIndex], [field]: field === 'quantity' ? Number(value) : value };

      if (field === 'serviceId') {
        const service = services.find(s => String(s.id) === String(value));
        pkgServices[sIndex].sellingPrice = service?.costPrice || 0;
      }

      pkg.services = pkgServices;
      updated[pkgIndex] = pkg;
      return updated;
    });
  }, [services]);

  const removePackageService = useCallback((pkgIndex, sIndex) => {
    setSelectedPackages(prev => {
      const updated = [...prev];
      const pkg = { ...updated[pkgIndex] };
      pkg.services = pkg.services.filter((_, i) => i !== sIndex);
      updated[pkgIndex] = pkg;
      return updated;
    });
  }, []);

  const addPackageService = useCallback((pkgIndex) => {
    setSelectedPackages(prev => {
      const updated = [...prev];
      const pkg = { ...updated[pkgIndex] };
      pkg.services = [...pkg.services, { serviceId: '', quantity: 1, sellingPrice: 0 }];
      updated[pkgIndex] = pkg;
      return updated;
    });
  }, []);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end >= start) {
        const diffYears = end.getFullYear() - start.getFullYear();
        const diffMonths = end.getMonth() - start.getMonth();
        const totalMonths = diffYears * 12 + diffMonths;

        // Cập nhật durationMonths nếu khác giá trị hiện tại
        // Thêm 1 nếu muốn tính cả tháng kết thúc (tùy nghiệp vụ, ở đây tính chênh lệch thuần)
        if (formData.durationMonths !== totalMonths) {
          setFormData(prev => ({
            ...prev,
            durationMonths: totalMonths <= 0 ? 1 : totalMonths
          }));
        }
      }
    }
  }, [formData.startDate, formData.endDate]);

  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
    // Clear error for this field
    setErrors(prev => prev[name] ? { ...prev, [name]: null } : prev);
  }, []);

  const handleNumberChange = useCallback((name, value) => {
    const numValue = parseNumber(value);
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
    // Clear error for this field
    setErrors(prev => prev[name] ? { ...prev, [name]: null } : prev);
  }, []);

  const handleServiceChange = useCallback((index, field, value) => {
    setSelectedServices(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: field === 'quantity' ? Number(value) : value };
      return updated;
    });
    // Clear services error
    setErrors(prev => prev.services ? { ...prev, services: null } : prev);
  }, []);

  const addService = useCallback(() => {
    setSelectedServices(prev => [...prev, { serviceId: '', quantity: 1 }]);
  }, []);

  const removeService = useCallback((index) => {
    setSelectedServices(prev => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

  const handleLinkChange = useCallback((index, value) => {
    setDocumentLinks(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const addLink = useCallback(() => {
    setDocumentLinks(prev => [...prev, '']);
  }, []);

  const removeLink = useCallback((index) => {
    setDocumentLinks(prev => {
      // Prevent removing initial placeholder links
      if (index < LINK_PLACEHOLDERS.length) return prev;

      const updated = prev.filter((_, i) => i !== index);
      return updated.length ? updated : prev;
    });
  }, []);

  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

    if (selectedFiles.length > 5) {
      setErrors(prev => ({ ...prev, files: 'Tối đa 5 file' }));
      return;
    }

    if (totalSize > 25 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, files: 'Tổng dung lượng không quá 25MB' }));
      return;
    }

    setFiles(selectedFiles);
    setErrors(prev => ({ ...prev, files: null }));
  }, []);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const totalValue = useMemo(() => {
    const standaloneTotal = selectedServices.reduce((total, item) => {
      if (!item.serviceId) return total;
      const service = services.find(s => String(s.id) === String(item.serviceId));
      return total + (service?.costPrice || 0) * item.quantity;
    }, 0);

    const packagesTotal = selectedPackages.reduce((total, pkg) => {
      const pkgQuantity = Number(pkg.quantity) || 1;
      return total + pkg.services.reduce((pTotal, s) => {
        return pTotal + (s.sellingPrice || 0) * s.quantity * pkgQuantity;
      }, 0);
    }, 0);

    return standaloneTotal + packagesTotal;
  }, [selectedServices, selectedPackages, services]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên cơ hội';
    if (!formData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả';
    if (!formData.field) newErrors.field = 'Vui lòng chọn lĩnh vực';
    if (!formData.expectedRevenue || formData.expectedRevenue <= 0) newErrors.expectedRevenue = 'Vui lòng nhập doanh thu kỳ vọng';
    if (!formData.budget || formData.budget <= 0) newErrors.budget = 'Vui lòng nhập ngân sách dự kiến';
    if (!formData.startDate) newErrors.startDate = 'Vui lòng chọn ngày khởi công';
    if (!formData.endDate) newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    if (formData.successChance <= 0) newErrors.successChance = 'Khả năng thành công phải lớn hơn 0%';
    if (!formData.durationMonths || formData.durationMonths < 1) newErrors.durationMonths = 'Vui lòng nhập số tháng triển khai';

    // Validate end date after start date
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày khởi công';
    }

    // Validate start date after today
    const today = new Date().toISOString().split('T')[0];
    if (formData.startDate && formData.startDate <= today) {
      newErrors.startDate = 'Dự kiến bắt đầu phải sau ngày hiện tại';
    }

    // Validate selected services - all services must be selected
    const hasUnselectedService = selectedServices.some(s => !s.serviceId);
    if (hasUnselectedService) {
      newErrors.services = 'Vui lòng chọn dịch vụ đề xuất';
    }

    // if (Object.keys(newErrors).length > 0) {
    //   setErrors(newErrors);
    //   return;
    // }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      const firstErrorField =
        FIELD_ORDER.find((k) => newErrors[k]) || Object.keys(newErrors)[0];

      // đợi UI render class lỗi rồi focus
      requestAnimationFrame(() => focusField(firstErrorField));

      return;
    }

    try {
      setIsUploading(true);
      let attachments = [];

      // 1. Add document links
      const validLinks = documentLinks
        .filter(l => l.trim())
        .map(url => ({ type: 'LINK', name: url, url }));
      attachments.push(...validLinks);

      // 2. Upload files to Cloudinary
      if (files.length > 0) {
        const uploadPromises = files.map((file, index) =>
          uploadToCloudinary(
            file,
            "GETVINI/ERP/opportunities",
            (progress) => setUploadProgress(prev => ({ ...prev, [index]: progress }))
          )
        );
        const uploadedFiles = await Promise.all(uploadPromises);
        attachments.push(...uploadedFiles);
      }

      const validServices = selectedServices
        .filter(s => s.serviceId)
        .map(s => ({
          id: s.serviceId,
          quantity: s.quantity
        }));

      const validPackages = selectedPackages
        .filter(pkg => pkg.servicePackageId)
        .map(pkg => ({
          servicePackageId: pkg.servicePackageId,
          name: pkg.name,
          description: pkg.description,
          quantity: Number(pkg.quantity) || 1,
          services: pkg.services.filter(s => s.serviceId).map(s => ({
            serviceId: s.serviceId,
            quantity: s.quantity,
            sellingPrice: s.sellingPrice
          }))
        }));

      const result = await createOpportunity({
        ...formData,
        services: validServices,
        packages: validPackages,
        attachments
      }).unwrap();

      navigate(`/opportunities/${result.id}`);
      onSuccess?.();
      setIsUploading(false);
      onClose();

      // Reset form
      setFormData({
        name: '',
        description: '',
        field: '',
        expectedRevenue: 0,
        budget: 0,
        startDate: '',
        endDate: '',
        priority: 'Medium',
        successChance: 0,
        region: [],
        durationMonths: 0,
        customerRequirements: '',
      });
      setSelectedServices([{ serviceId: '', quantity: 1 }]);
      setSelectedPackages([{ servicePackageId: '', services: [] }]);
      setDocumentLinks(Array(LINK_PLACEHOLDERS.length).fill(''));
      setFiles([]);
    } catch (err) {
      setIsUploading(false);
      setErrors({ submit: err?.data?.message || err?.message || 'Có lỗi xảy ra' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Tạo Cơ Hội Mới</h2>
                <p className="text-blue-100 text-sm">Điền thông tin chi tiết của cơ hội </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-88px)]">
            <div className="p-6 space-y-8">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {errors.submit}
                </div>
              )}

              {/* Section: Thông tin cơ bản */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Thông tin cơ bản</h3>
                </div>

                {/* Tên doanh nghiệp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên cơ hội / Doanh nghiệp</label>
                  <input
                    ref={setFieldRef('name')}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="VD: GETVINI"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.name}</p>}
                </div>

                {/* Mô tả */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <textarea
                    ref={setFieldRef('description')}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Mô tả chi tiết về cơ hội..."
                    maxLength={200}
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all resize-none ${errors.description ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && <p className="text-sm text-red-500 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.description}</p>}
                    <span className={`text-xs ml-auto ${formData.description.length > 180 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {formData.description.length}/200
                    </span>
                  </div>
                </div>

                {/* Lĩnh vực */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lĩnh vực</label>
                  <select
                    ref={setFieldRef('field')}
                    name="field"
                    value={formData.field}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer ${errors.field ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {FIELDS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  {errors.field && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.field}</p>}
                </div>
              </div>

              {/* Section: Tài chính */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Thông tin tài chính</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className={`bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border ${errors.expectedRevenue ? 'border-red-400' : 'border-green-100'}`}>
                    <label className="block text-sm font-medium text-green-700 mb-2">Doanh thu kỳ vọng<span className="text-gray-400 italic"> (giá muốn bán cho khách)</span></label>
                    <div className="relative">
                      <input
                        ref={setFieldRef('expectedRevenue')}
                        type="text"
                        name="expectedRevenue"
                        value={formatNumber(formData.expectedRevenue)}
                        onChange={(e) => handleNumberChange('expectedRevenue', e.target.value)}
                        placeholder="0"
                        className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white transition-all ${errors.expectedRevenue ? 'border-red-400' : 'border-green-200'}`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 font-medium text-sm">VNĐ</span>
                    </div>
                    {errors.expectedRevenue && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.expectedRevenue}</p>}
                  </div>

                  <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border ${errors.budget ? 'border-red-400' : 'border-blue-100'}`}>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Ngân sách dự kiến<span className="text-gray-400 italic"> (ngân sách của khách đề xuất)</span></label>
                    <div className="relative">
                      <input
                        ref={setFieldRef('budget')}
                        type="text"
                        name="budget"
                        value={formatNumber(formData.budget)}
                        onChange={(e) => handleNumberChange('budget', e.target.value)}
                        placeholder="0"
                        className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all ${errors.budget ? 'border-red-400' : 'border-blue-200'}`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-medium text-sm">VNĐ</span>
                    </div>
                    {errors.budget && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.budget}</p>}
                  </div>
                </div>
              </div>

              {/* Section: Thời gian & Địa điểm */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Thời gian & Địa điểm</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dự kiến bắt đầu (dd/mm/yyyy)</label>
                    <div className="relative group">
                      <input
                        ref={setFieldRef('startDate')}
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.startDate ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                      />
                    </div>
                    {errors.startDate && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dự kiến kết thúc (dd/mm/yyyy)</label>
                    <div className="relative group">
                      <input
                        ref={setFieldRef('endDate')}
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.endDate ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                      />
                    </div>
                    {errors.endDate && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.endDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa điểm triển khai
                    </label>
                    <Select
                      isMulti
                      name="region"
                      options={REGIONS}
                      value={REGIONS.filter(r => formData.region.includes(r.value))}
                      onChange={(selectedOptions) => {
                        setFormData(prev => ({
                          ...prev,
                          region: selectedOptions ? selectedOptions.map(o => o.value) : []
                        }));
                      }}
                      placeholder="Chọn tỉnh thành (có thể chọn nhiều)..."
                      classNamePrefix="react-select"
                      className="text-sm"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderWidth: '2px',
                          borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
                          '&:hover': {
                            borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                          },
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#eff6ff',
                          borderRadius: '0.5rem',
                          border: '1px solid #bfdbfe',
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: '500',
                          padding: '2px 8px',
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#3b82f6',
                          '&:hover': {
                            backgroundColor: '#dbeafe',
                            color: '#1d4ed8',
                            borderRadius: '0 0.5rem 0.5rem 0',
                          },
                        }),
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tháng triển khai
                    </label>
                    <div className="relative">
                      <input
                        ref={setFieldRef('durationMonths')}
                        type="number"
                        name="durationMonths"
                        value={formData.durationMonths}
                        onChange={handleChange}
                        min={1}
                        disabled
                        className={`w-full px-4 py-3 pr-20 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all ${errors.durationMonths ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Tháng</span>
                    </div>
                    {errors.durationMonths && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.durationMonths}</p>}
                  </div>
                </div>
              </div>

              {/* Section: Đánh giá */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Target className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Đánh giá cơ hội</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Độ ưu tiên</label>
                    <div className="flex gap-2">
                      {PRIORITIES.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, priority: p.value }))}
                          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${formData.priority === p.value
                            ? p.value === 'High' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                              : p.value === 'Medium' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Khả năng thành công</label>
                    <div className="relative">
                      <input
                        ref={setFieldRef('successChance')}
                        type="range"
                        name="successChance"
                        value={formData.successChance}
                        onChange={handleChange}
                        min={0}
                        max={100}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-400">0%</span>
                        <span className={`text-lg font-bold ${formData.successChance >= 70 ? 'text-green-600'
                          : formData.successChance >= 40 ? 'text-orange-500'
                            : 'text-red-500'
                          }`}>
                          {formData.successChance}%
                        </span>
                        {errors.successChance && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.successChance}</p>}
                        <span className="text-xs text-gray-400">100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Dịch vụ */}
              <div ref={setFieldRef('services')} className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">Dịch vụ đề xuất</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={addPackage}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Gói dịch vụ
                    </button>
                    <button
                      type="button"
                      onClick={addService}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Dịch vụ lẻ
                    </button>
                  </div>
                </div>

                {/* Packages Selection */}
                <div className="space-y-4 pt-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gói dịch vụ đề xuất</p>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedPackages.map((pkg, index) => (
                      <div key={index} className="space-y-3">
                        {!pkg.servicePackageId ? (
                          <div className="flex items-center gap-3 p-3 rounded-xl border bg-blue-50/30 border-blue-100">
                            <select
                              className="flex-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all text-sm font-bold text-blue-900"
                              value={pkg.servicePackageId}
                              onChange={(e) => handlePackageTemplateChange(index, e.target.value)}
                            >
                              <option value="">-- Chọn gói mẫu --</option>
                              {packageTemplates
                                .filter(t => !selectedPackages.some(pkg => String(pkg.servicePackageId) === String(t.id)))
                                .map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removePackage(index)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <PackageItem
                            index={index}
                            pkg={pkg}
                            availableServices={services}
                            onRemove={removePackage}
                            onServiceChange={handlePackageServiceChange}
                            onRemoveService={removePackageService}
                            onAddService={addPackageService}
                            onQuantityChange={handlePackageQuantityChange}
                          />
                        )}
                      </div>
                    ))}
                    {selectedPackages.length === 0 && (
                      <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Chưa chọn gói dịch vụ nào
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dịch vụ lẻ</p>
                  <div className="space-y-3">
                    {selectedServices.map((item, index) => {
                      // Filter out already selected services (except current selection)
                      const selectedIds = selectedServices
                        .filter((_, i) => i !== index)
                        .map(s => String(s.serviceId))
                        .filter(id => id);
                      const availableServices = services.filter(s => !selectedIds.includes(String(s.id)));

                      return (
                        <ServiceItem
                          key={index}
                          index={index}
                          item={item}
                          availableServices={availableServices}
                          onServiceChange={handleServiceChange}
                          onRemove={removeService}
                          hasError={!!errors.services}
                        />
                      );
                    })}
                  </div>
                </div>

                {errors.services && <p className="text-sm text-red-500 flex items-center gap-1 mb-3"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.services}</p>}

                {/* Total */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-xl text-white">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Tổng giá vốn của các dịch vụ đã chọn:</span>
                    <span className="text-2xl font-bold">{totalValue.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>
              </div>

              {/* Section: Yêu cầu & Tài liệu */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <FileText className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-semibold text-gray-900">Yêu cầu & Tài liệu</h3>
                </div>

                {/* Mô tả yêu cầu khách hàng */}
                <div>
                  <label className="block text-sm  text-gray-400 mb-2 italic">Tài liệu mô tả yêu cầu khách hàng</label>
                  {/* <textarea
                    name="customerRequirements"
                    value={formData.customerRequirements}
                    onChange={handleChange}
                    placeholder="Chi tiết yêu cầu từ khách hàng..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 transition-all resize-none"
                  /> */}
                </div>

                {/* Link tài liệu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link tài liệu tham khảo</label>
                  <div className="space-y-3">
                    {documentLinks.map((link, index) => (
                      <LinkItem
                        key={index}
                        index={index}
                        link={link}
                        onLinkChange={handleLinkChange}
                        onRemove={removeLink}
                        showRemove={index >= LINK_PLACEHOLDERS.length}
                        placeholder={LINK_PLACEHOLDERS[index]}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addLink}
                    className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm link
                  </button>
                </div>

                {/* Tệp đính kèm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tệp đính kèm</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
                    <label className="cursor-pointer">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">Kéo thả file hoặc click để chọn</p>
                      <p className="text-xs text-gray-400 mt-1">Tối đa 5 file, tổng dung lượng 25MB</p>
                      <p className="text-xs text-gray-400">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />
                    </label>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Tệp đã chọn ({files.length}):</p>
                      <div className="grid grid-cols-1 gap-2">
                        {files.map((file, index) => (
                          <FileItem
                            key={index}
                            index={index}
                            file={file}
                            onRemove={removeFile}
                            progress={uploadProgress[index]}
                            isUploading={isUploading}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.files && <p className="mt-2 text-sm text-red-500">{errors.files}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploading}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 flex items-center justify-center gap-2"
              >
                {isLoading || isUploading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{isUploading ? 'Đang tạo cơ hội...' : 'Đang tạo...'}</span>
                  </>
                ) : 'Tạo cơ hội'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OpportunityModal;
