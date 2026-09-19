import { WalletCards } from 'lucide-react'
import { useGetGenerationBudgetQuery } from '../../api/videoGenerations'

const formatMoney = (value) => `${Math.round(Number(value || 0)).toLocaleString('vi-VN')} VNĐ`

export default function GenerationBudgetCard({ taskId }) {
  const { data, isFetching, isError, error } = useGetGenerationBudgetQuery(taskId, {
    skip: !taskId,
    pollingInterval: 5000,
    refetchOnFocus: true,
  })

  if (!taskId) return null
  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error?.data?.message || 'Không thể tải hạn mức tạo video.'}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Đang tải hạn mức...
      </div>
    )
  }

  const usagePercent = data.limit > 0 ? Math.min(100, (data.used / data.limit) * 100) : 0
  const remainingClass = data.remaining > 0 ? 'text-emerald-700' : 'text-red-700'

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
          <WalletCards className="h-4 w-4" /> Ngân sách Video AI + Motion
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
            Phân bổ {Number(data.allocationPercent || 0).toLocaleString('vi-VN')}%
          </span>
          {isFetching && <span className="text-[10px] text-blue-500">Đang cập nhật...</span>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Hạn mức</p>
          <p className="text-xs font-bold text-slate-800">{formatMoney(data.limit)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Đã dùng/đang xử lý</p>
          <p className="text-xs font-bold text-orange-700">{formatMoney(data.used)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Còn lại</p>
          <p className={`text-xs font-black ${remainingClass}`}>{formatMoney(data.remaining)}</p>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
        <div
          className={`h-full rounded-full ${usagePercent >= 100 ? 'bg-red-500' : 'bg-blue-600'}`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
    </div>
  )
}
