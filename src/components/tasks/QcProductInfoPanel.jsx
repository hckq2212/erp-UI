import { useState } from 'react';
import { Info, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useGetQcProductInfoQuery } from '../../api/qc';

export const QcProductInfoPanel = ({ projectId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isFetching, error } = useGetQcProductInfoQuery(projectId, {
    skip: !projectId || !isOpen,
  });

  const items = data?.items || [];

  if (!projectId) return null;

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
      >
        <Info className="w-3.5 h-3.5" />
        Thông tin chuẩn đang đối chiếu
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="p-2 border border-slate-200 rounded-xl bg-white space-y-1.5 max-h-64 overflow-y-auto">
          {isFetching && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải thông tin sản phẩm...
            </div>
          )}

          {!isFetching && error && (
            <div className="text-xs text-red-500">
              {error?.data?.message || 'Không thể tải thông tin sản phẩm chuẩn'}
            </div>
          )}

          {!isFetching && !error && items.length === 0 && (
            <div className="text-xs text-slate-400">Chưa có thông tin sản phẩm chuẩn</div>
          )}

          {!isFetching && items.length > 0 && (
            <div className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={idx} className="py-1.5 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-slate-700">{item.productName}</div>
                    {item.docUrl && (
                      <a
                        href={item.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" /> Tài liệu
                      </a>
                    )}
                  </div>
                  {Array.isArray(item.specs) && item.specs.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {item.specs.map((spec, specIdx) => (
                        <div key={specIdx} className="flex gap-1 text-slate-500">
                          <span className="font-medium text-slate-600">{spec.key}:</span>
                          <span className="truncate">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.note && <div className="text-slate-400 italic">{item.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
