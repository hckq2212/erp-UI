import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../components/ui/Button';
import {
  useGetWorkloadNormSettingsQuery,
  useUpdateWorkloadNormSettingsMutation,
} from '../../api/settings';
import { STAFF_ROLES, USER_ROLE } from '../../utils/enums';

// Phải khớp WorkloadNormService.DAYS_PER_MONTH ở backend: 22.000 Vinicoin/tháng = 800 Vinicoin/ngày.
const DAYS_PER_MONTH = 27.5;

const inputClass =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN', {
  maximumFractionDigits: 2,
});

export const WorkloadNormSettingsTab = () => {
  const { data, isLoading, error } = useGetWorkloadNormSettingsQuery();
  const [updateWorkloadNormSettings, { isLoading: isSaving }] = useUpdateWorkloadNormSettingsMutation();
  const [norms, setNorms] = useState({});

  const serverNorms = useMemo(() => data?.norms || [], [data?.norms]);

  useEffect(() => {
    if (serverNorms.length > 0) {
      setNorms(Object.fromEntries(serverNorms.map((item) => [item.role, String(item.monthlyNorm)])));
    }
  }, [serverNorms]);

  const isDirty = serverNorms.some((item) => Number(norms[item.role]) !== Number(item.monthlyNorm));
  const canSave = STAFF_ROLES.every((role) => Number(norms[role]) > 0) && isDirty;

  const handleReset = () => {
    setNorms(Object.fromEntries(serverNorms.map((item) => [item.role, String(item.monthlyNorm)])));
  };

  const handleSave = async () => {
    try {
      await updateWorkloadNormSettings({
        norms: STAFF_ROLES.map((role) => ({
          role,
          monthlyNorm: Number(norms[role]),
        })),
      }).unwrap();
      toast.success('Đã lưu định mức workload');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể lưu định mức workload');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 p-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải định mức...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-xl text-red-600 text-sm">
        {error?.data?.message || 'Không thể tải định mức workload'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-3xl space-y-5">
      <div>
        <h2 className="text-base font-bold text-gray-900">Định mức workload theo role</h2>
        <p className="text-sm text-gray-500 mt-1">
          Workload ngày được tính bằng Vinicoin công việc chia cho định mức ngày của role.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Định mức tháng</th>
              <th className="px-4 py-3 text-left">Định mức ngày</th>
              <th className="px-4 py-3 text-left">Nguồn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {STAFF_ROLES.map((role) => {
              const row = serverNorms.find((item) => item.role === role);
              const monthlyNorm = Number(norms[role] || row?.monthlyNorm || 0);
              const dailyNorm = monthlyNorm / DAYS_PER_MONTH;

              return (
                <tr key={role}>
                  <td className="px-4 py-3 font-bold text-slate-700">{USER_ROLE[role] || role}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={norms[role] || ''}
                      onChange={(event) => setNorms((prev) => ({ ...prev, [role]: event.target.value }))}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-600">
                    {formatNumber(dailyNorm)} Vinicoin/ngày
                  </td>
                  <td className="px-4 py-3">
                    {row?.isCustomized ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đã cấu hình
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                        <Info className="h-3.5 w-3.5" /> Mặc định
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        {isDirty && (
          <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
            Hoàn tác
          </Button>
        )}
        <Button type="button" size="sm" isLoading={isSaving} disabled={!canSave} onClick={handleSave}>
          Lưu định mức
        </Button>
      </div>
    </div>
  );
};
