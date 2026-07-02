export const getTaskDisplayName = (task) => task?.nickname?.trim() || task?.name?.trim() || task?.code?.trim() || '';

export const getTaskOriginalName = (task) => {
  if (!task?.nickname?.trim()) return '';
  return task?.name || '';
};
