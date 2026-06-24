import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUpdateTaskNicknameMutation } from '../../api/tasks';
import { getTaskDisplayName } from '../../utils/taskName';

export const InlineTaskNickname = ({ task, canEdit = false, projectId, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task?.nickname || '');
  const inputRef = useRef(null);
  const [updateNickname, { isLoading }] = useUpdateTaskNicknameMutation();

  useEffect(() => {
    if (!isEditing) setValue(task?.nickname || '');
  }, [task?.nickname, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const stopRowNavigation = (event) => event.stopPropagation();

  const cancel = () => {
    setValue(task?.nickname || '');
    setIsEditing(false);
  };

  const save = async () => {
    if (isLoading) return;

    const normalized = value.trim();
    const current = task?.nickname?.trim() || '';
    if (normalized === current) {
      setIsEditing(false);
      return;
    }

    try {
      await updateNickname({
        id: task.id,
        nickname: normalized || null,
        projectId: projectId || task?.project?.id,
      }).unwrap();
      setIsEditing(false);
    } catch (error) {
      setValue(task?.nickname || '');
      toast.error(error?.data?.message || 'Không thể cập nhật nickname');
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`} onClick={stopRowNavigation}>
        <input
          ref={inputRef}
          value={value}
          maxLength={120}
          disabled={isLoading}
          aria-label="Nickname công việc"
          placeholder="Nhập nickname..."
          className="min-w-0 w-full rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          onChange={(event) => setValue(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              cancel();
            }
          }}
        />
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
        ) : (
          <>
            <button type="button" title="Lưu nickname" onMouseDown={(event) => event.preventDefault()} onClick={save} className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50">
              <Check className="h-4 w-4" />
            </button>
            <button type="button" title="Hủy" onMouseDown={(event) => event.preventDefault()} onClick={cancel} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`group/nickname flex min-w-0 items-start gap-2 ${className}`} onClick={stopRowNavigation}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-900" title={getTaskDisplayName(task)}>
          {getTaskDisplayName(task)}
        </p>
      </div>
      {canEdit && (
        <button
          type="button"
          title={task?.nickname ? 'Sửa nickname' : 'Thêm nickname'}
          aria-label={task?.nickname ? 'Sửa nickname' : 'Thêm nickname'}
          onClick={() => setIsEditing(true)}
          className="shrink-0 rounded-md p-1 text-gray-400 opacity-100 transition-all hover:bg-blue-50 hover:text-blue-600 sm:text-gray-300 sm:opacity-0 sm:group-hover/nickname:opacity-100 sm:focus:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
