import { useLayoutEffect, useRef, useState } from 'react';
import { Info, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useGetQcProductInfoQuery } from '../../api/qc';

const ExtractedTextBlock = ({ html }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) {
      setIsOverflowing(false);
      return;
    }
    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [html]);

  return (
    <div className="rounded-lg border border-slate-300 bg-slate-50">
      <div
        ref={textRef}
        className={`rich-content px-2 py-1.5 font-medium text-slate-900 ${isExpanded ? 'max-h-80 overflow-y-auto' : 'line-clamp-6'}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center justify-center gap-1 border-t border-slate-200 py-1 text-[11px] font-bold text-blue-600 hover:bg-slate-100"
        >
          {isExpanded ? (
            <>
              Thu gọn <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Xem đầy đủ <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

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
              {items.map((item, idx) => {
                return (
                  <div key={idx} className="py-1.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-slate-800">{item.productName}</div>
                      {item.fileUrl && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" /> Tài liệu
                        </a>
                      )}
                    </div>
                    {item.extractedText && <ExtractedTextBlock html={item.extractedText} />}
                    {item.note && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-1 text-slate-400">
                        <span className="font-semibold text-slate-500">Chú thích:</span> {item.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};