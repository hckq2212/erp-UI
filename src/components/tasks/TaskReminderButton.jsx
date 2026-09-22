import { Bell } from 'lucide-react';
import { useSendTaskReminderMutation } from '../../api/tasks';
import { toast } from 'react-toastify';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

const NON_REMINDABLE_STATUSES = new Set([
  'COMPLETED',
  'ACCEPTED',
  'DONE',
  'INTERNAL_COMPLETED',
  'AWAITING_REVIEW',
  'ON_HOLD',
  'CANCELLED',
]);

export const TaskReminderButton = ({
  task,
  isProjectInProgress = true,
  canManage = false,
  variant = 'table',
  className,
  ...props
}) => {
  const [sendReminder, { isLoading }] = useSendTaskReminderMutation();

  const hasPerformer = Boolean(
    task?.assigneeId || task?.helperId || task?.assignee?.id || task?.helper?.id
  );

  const isEligible =
    isProjectInProgress &&
    canManage &&
    hasPerformer &&
    !NON_REMINDABLE_STATUSES.has(task?.status);

  if (!isEligible) return null;

  const handleSendReminder = async (e) => {
    e?.stopPropagation?.();
    try {
      await sendReminder(task.id).unwrap();
      toast.success('Đã gửi nhắc nhở thành công!');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Lỗi khi gửi nhắc nhở');
    }
  };

  if (variant === 'detail') {
    return (
      <Button
        onClick={handleSendReminder}
        isLoading={isLoading}
        className={cn(
          "rounded-2xl py-3 px-6 shadow-lg shadow-blue-100 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2",
          className
        )}
        {...props}
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span>Nhắc việc</span>
      </Button>
    );
  }

  // Table row variant
  return (
    <button
      type="button"
      onClick={handleSendReminder}
      disabled={isLoading}
      className={cn(
        "inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase disabled:opacity-60",
        className
      )}
      title="Gửi thông báo nhắc việc đến nhân sự thực hiện"
      {...props}
    >
      <Bell className="w-3.5 h-3.5" />
      <span>{isLoading ? 'Đang nhắc...' : 'Nhắc việc'}</span>
    </button>
  );
};

export default TaskReminderButton;
