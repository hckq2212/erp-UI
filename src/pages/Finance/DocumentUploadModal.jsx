import { useState, useRef, useEffect } from 'react';
import {
  Upload, X, FileText, Image as ImageIcon, Loader2, Link as LinkIcon, Check, AlertCircle, FileCheck, Receipt
} from 'lucide-react';
import { toast } from 'react-toastify';
import { uploadToCloudinary } from '../../utils/cloudinary';
import {
  useCreateAcceptanceMinuteMutation,
  useCreateVatInvoiceMutation
} from '../../api/paymentDashboard';

/**
 * Modal upload tài liệu (BBNT / Hóa đơn VAT)
 * 1 modal chuyên biệt cho từng loại, không chia tab chuyển đổi
 */
export const DocumentUploadModal = ({
  isOpen,
  onClose,
  row,
  contracts = [],
  initialType = 'acceptance',
  type: propType,
  onSuccess
}) => {
  const type = propType || initialType || 'acceptance';
  const [selectedContractId, setSelectedContractId] = useState(row?.id || '');
  const [name, setName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);
  const [createAcceptance, acceptanceState] = useCreateAcceptanceMinuteMutation();
  const [createInvoice, invoiceState] = useCreateVatInvoiceMutation();

  useEffect(() => {
    if (isOpen) {
      setName('');
      setFileUrl('');
      setSelectedFile(null);
      setErrorMessage('');
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedContractId(row?.id || '');
    }
  }, [isOpen, row, type]);

  if (!isOpen) return null;
  if (!row && (!contracts || contracts.length === 0)) return null;

  const activeContract = row || contracts.find((c) => c.id === selectedContractId) || null;
  const isSaving = acceptanceState.isLoading || invoiceState.isLoading || isUploading;

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('Kích thước tệp không được vượt quá 20MB');
      toast.error('Kích thước tệp không được vượt quá 20MB');
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);

    // Tự động điền tên tài liệu từ tên file nếu chưa nhập
    if (!name.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();
      setName(cleanName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên tài liệu');
      return;
    }

    let finalFileUrl = fileUrl.trim();

    // Nếu chọn upload file từ máy tính
    if (inputMode === 'upload') {
      if (!selectedFile) {
        setErrorMessage('Vui lòng chọn tệp tài liệu cần tải lên');
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(10);
        const folder = type === 'acceptance'
          ? 'GETVINI/ERP/acceptance-minutes'
          : 'GETVINI/ERP/vat-invoices';

        const uploadResult = await uploadToCloudinary(selectedFile, folder, (progress) => {
          setUploadProgress(progress);
        });

        finalFileUrl = uploadResult?.url || '';
        if (!finalFileUrl) {
          throw new Error('Không nhận được đường dẫn tệp sau khi tải lên');
        }
      } catch (err) {
        setIsUploading(false);
        const msg = err.message || 'Lỗi khi tải tệp lên máy chủ';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
    } else {
      if (!finalFileUrl) {
        setErrorMessage('Vui lòng nhập đường dẫn liên kết tệp');
        return;
      }
    }

    const targetContractId = row?.id || selectedContractId;
    if (!targetContractId) {
      setErrorMessage('Vui lòng chọn Dự án / Hợp đồng liên quan');
      return;
    }

    try {
      const payload = {
        contractId: targetContractId,
        name: name.trim(),
        fileUrl: finalFileUrl
      };

      if (type === 'acceptance') {
        await createAcceptance(payload).unwrap();
        toast.success('Đã thêm biên bản nghiệm thu thành công');
      } else {
        await createInvoice(payload).unwrap();
        toast.success('Đã thêm hóa đơn VAT thành công');
      }

      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      const msg = error?.data?.message || 'Không thể lưu tài liệu';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setName('');
    setFileUrl('');
    setErrorMessage('');
    setIsUploading(false);
    setUploadProgress(0);
    onClose();
  };

  const isPdf = selectedFile?.type?.includes('pdf') || selectedFile?.name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs ${
              type === 'acceptance' ? 'bg-emerald-50 text-[#006c49]' : 'bg-[#fff5ee] text-[#ea580c]'
            }`}>
              {type === 'acceptance' ? <FileCheck className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0b1c30]">
                {type === 'acceptance' ? 'Thêm biên bản nghiệm thu (BBNT)' : 'Thêm hóa đơn VAT'}
              </h2>
              {activeContract ? (
                <p className="text-xs text-slate-500 font-medium">
                  Dự án: <span className="text-slate-800 font-semibold">{activeContract.projectName || activeContract.contractName}</span> · Mã HĐ: <span className="text-slate-700">{activeContract.contractCode}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  Chọn dự án / hợp đồng để đính kèm tài liệu
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Chọn dự án/hợp đồng nếu mở từ trang chung */}
          {!row && contracts.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Dự án / Hợp đồng liên quan *</label>
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#ea580c] focus:outline-none"
                required
              >
                <option value="">-- Chọn dự án / hợp đồng --</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractCode ? `[${c.contractCode}] ` : ''}{c.projectName || c.contractName} ({c.customerName || 'Chưa rõ KH'})
                  </option>
                ))}
              </select>
            </div>
          )}


          {/* Tab chọn cách nhập: Upload file hoặc Nhập Link */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="font-semibold text-slate-700">Tệp tài liệu đính kèm</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  inputMode === 'upload' ? 'bg-[#ffebd6] text-[#ea580c] font-bold' : 'hover:text-slate-800'
                }`}
              >
                Tải tệp từ máy
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  inputMode === 'url' ? 'bg-[#ffebd6] text-[#ea580c] font-bold' : 'hover:text-slate-800'
                }`}
              >
                Nhập liên kết (URL)
              </button>
            </div>
          </div>

          {/* Khu vực Upload tệp (Phỏng theo DebtDetailsModal) */}
          {inputMode === 'upload' ? (
            <div>
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-[#f97316] bg-[#fff8f4]'
                      : 'border-slate-200 bg-slate-50/60 hover:border-[#f97316]/60 hover:bg-[#fffbf8]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    disabled={isSaving}
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-100 text-[#ea580c] mb-2.5">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Nhấp để chọn tệp hoặc kéo thả vào đây
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hỗ trợ PDF, DOCX, XLSX, PNG, JPG (Tối đa 20MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-amber-50/40 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ea580c] text-white shrink-0 shadow-xs">
                      {isPdf ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Sẵn sàng tải lên
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isSaving}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Xóa tệp đã chọn"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... hoặc link file"
                  required={inputMode === 'url'}
                  className="w-full rounded-xl bg-slate-50 pl-10 pr-3 py-2.5 text-xs text-slate-800 border border-slate-200 outline-none ring-[#f97316] focus:ring-2 focus:bg-white transition-all font-medium"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Nhập liên kết công khai tới file PDF, Word, Excel hoặc Google Drive.
              </p>
            </div>
          )}

          {/* Ô nhập tên tài liệu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên tài liệu hiển thị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'acceptance' ? 'VD: BBNT Giai đoạn 1' : 'VD: Hóa đơn VAT đợt 1'}
              className="w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 border border-slate-200 outline-none ring-[#f97316] focus:ring-2 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5 text-[#ea580c]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang tải tệp lên máy chủ...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#00b07a] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="h-9 rounded-xl bg-slate-100 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex h-9 items-center justify-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{isUploading ? 'Đang tải lên...' : 'Đang lưu...'}</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{type === 'acceptance' ? 'Lưu biên bản' : 'Lưu hóa đơn'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
