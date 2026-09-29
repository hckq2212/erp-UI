import { useEffect, useState } from 'react';
import { CheckCircle2, Info, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../utils/format';
import {
  useGetQcSettingsQuery,
  useUpdateQcSettingsMutation,
} from '../../api/settings';

const selectClass =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

export const QcSettingsTab = () => {
  const { data, isLoading, error } = useGetQcSettingsQuery();
  const [updateQcSettings, { isLoading: isSaving }] = useUpdateQcSettingsMutation();

  const [provider, setProvider] = useState('');
  const [verifyModel, setVerifyModel] = useState('');
  const [reasoningEffort, setReasoningEffort] = useState('medium');
  const [maxBatch, setMaxBatch] = useState('');
  const [maxContext, setMaxContext] = useState('');

  const config = data?.config;
  const providers = data?.options?.providers || [];
  const models = data?.options?.models?.[provider] || [];
  const reasoningEfforts = data?.options?.reasoningEfforts || [];

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setVerifyModel(config.verifyModel);
      setReasoningEffort(config.reasoningEffort || 'medium');
      setMaxBatch(String(config.maxBatch));
      setMaxContext(String(config.maxContext));
    }
  }, [config?.provider, config?.verifyModel, config?.reasoningEffort, config?.maxBatch, config?.maxContext]);

  const handleProviderChange = (nextProvider) => {
    setProvider(nextProvider);
    setVerifyModel(data?.options?.models?.[nextProvider]?.[0]?.value || '');
  };

  const isDirty = config && (
    provider !== config.provider
    || verifyModel !== config.verifyModel
    || reasoningEffort !== (config.reasoningEffort || 'medium')
    || Number(maxBatch) !== config.maxBatch
    || Number(maxContext) !== config.maxContext
  );
  const canSave = Boolean(provider && verifyModel && maxBatch && maxContext) && (isDirty || !config?.isCustomized);

  const handleReset = () => {
    setProvider(config.provider);
    setVerifyModel(config.verifyModel);
    setReasoningEffort(config.reasoningEffort || 'medium');
    setMaxBatch(String(config.maxBatch));
    setMaxContext(String(config.maxContext));
  };

  const handleSave = async () => {
    try {
      await updateQcSettings({
        provider,
        verifyModel,
        reasoningEffort,
        maxBatch: Number(maxBatch),
        maxContext: Number(maxContext),
      }).unwrap();
      toast.success('Đã lưu cấu hình QC');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể lưu cấu hình QC');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 p-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải cấu hình...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-xl text-red-600 text-sm">
        {error?.data?.message || 'Không thể tải cấu hình QC'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl space-y-5">
      <div>
        <h2 className="text-base font-bold text-gray-900">QC đối chiếu sản phẩm</h2>
        <p className="text-sm text-gray-500 mt-1">
          Model AI dùng để đối chiếu file kết quả với thông tin chuẩn sản phẩm của dự án.
          Cấu hình áp dụng cho mọi lần chạy QC khi nộp công việc.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1.5">
          <span className="block text-sm font-medium text-slate-700">Nhà cung cấp</span>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className={selectClass}
          >
            {providers.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="block text-sm font-medium text-slate-700">Model đối chiếu</span>
          <select
            value={verifyModel}
            onChange={(e) => setVerifyModel(e.target.value)}
            className={selectClass}
          >
            {models.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="block text-sm font-medium text-slate-700">Mức suy luận (độ kỹ khi đối chiếu)</span>
          <select
            value={reasoningEffort}
            onChange={(e) => setReasoningEffort(e.target.value)}
            className={selectClass}
          >
            {reasoningEfforts.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="block text-xs text-slate-500">
            Chỉ áp dụng cho model có suy luận (GPT-5.x/GPT-OSS). Mức cao giúp bớt sót lỗi nhưng tốn token và chậm hơn.
          </span>
        </label>
        <label className="space-y-1.5">
          <span className="block text-sm font-medium text-slate-700">Số kịch bản tối đa / batch</span>
          <input
            type="number"
            min={1}
            max={50}
            value={maxBatch}
            onChange={(e) => setMaxBatch(e.target.value)}
            className={selectClass}
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-sm font-medium text-slate-700">Context window tối đa (token)</span>
          <input
            type="number"
            min={1000}
            max={200000}
            step={500}
            value={maxContext}
            onChange={(e) => setMaxContext(e.target.value)}
            className={selectClass}
          />
          <span className="block text-xs text-slate-500">
            OpenAI: 16000 trở lên. Groq free (giới hạn ~8000 token/phút): dùng ≤ 6000 và batch 1–2.
          </span>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 flex items-center gap-1.5 min-w-0">
          {config?.isCustomized ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Cập nhật lần cuối {formatDateTime(config.updatedAt)}</span>
            </>
          ) : (
            <>
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Chưa lưu cấu hình, đang dùng mặc định của AI service</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
              Hoàn tác
            </Button>
          )}
          <Button type="button" size="sm" isLoading={isSaving} disabled={!canSave} onClick={handleSave}>
            Lưu cấu hình
          </Button>
        </div>
      </div>
    </div>
  );
};
