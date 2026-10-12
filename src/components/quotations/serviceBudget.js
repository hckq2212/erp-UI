export const budgetLockedMessage = 'Dịch vụ chưa cho phép nhập ngân sách. Số tiền đã lưu được giữ nguyên.';

export const canEditServiceBudget = (item, servicesById, canEditPrices = true) =>
  canEditPrices && servicesById.get(String(item.serviceId))?.isBudget === true;
