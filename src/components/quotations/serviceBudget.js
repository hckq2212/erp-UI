export const budgetLockedMessage = 'Dịch vụ chưa cho phép nhập ngân sách. Số tiền đã lưu được giữ nguyên.';

export const isServiceBudgetEligible = (item, servicesById) => {
  if (item?.isBudget !== undefined) return Boolean(item.isBudget);
  if (item?.service?.isBudget !== undefined) return Boolean(item.service.isBudget);
  if (servicesById && item?.serviceId) {
    return Boolean(servicesById.get(String(item.serviceId))?.isBudget);
  }
  return false;
};

export const canEditServiceBudget = (item, servicesById, canEditPrices = true) =>
  canEditPrices && isServiceBudgetEligible(item, servicesById);
