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
        <div className="p-2 border border-slate-200 rounded-xl bg-white space-y-1.5 max-h-40 overflow-y-auto">
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
                <div key={idx} className="py-1.5 text-xs space-y-0.5">
                  <div className="font-bold text-slate-700">{item.productName}</div>
                  <div className="flex items-center justify-between gap-2 text-slate-500">
                    <span className="truncate">{item.sourceName || 'Không rõ nguồn'}</span>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" /> Nguồn
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
