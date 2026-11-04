import { Decimal } from 'decimal.js';

export const getServiceLineCost = (item) => new Decimal(item.cost || 0).plus(item.budget || 0).mul(item.quantity || 1).toNumber();

export const getInitialCustomPrice = (cost, budget = 0) => new Decimal(cost || 0).plus(budget || 0).div('0.6').div(10000).ceil().mul(10000).toNumber();

export const toServiceAddendumPricingItem = (item) => {
  const costPrice = Number(item.cost || 0);
  const budget = Number(item.budget || 0);
  const selectedPrice = Number(item.sellingPrice || 0);
  const totalCost = new Decimal(costPrice).plus(budget);
  return {
    ...item, costPrice, budget, selectedPrice, customPrice: selectedPrice,
    minPrice: totalCost.div('0.8').div(10000).ceil().mul(10000).toNumber(),
    recommendedPrice: getInitialCustomPrice(costPrice, budget),
    profitMargin: selectedPrice > 0 ? new Decimal(selectedPrice).minus(totalCost).div(selectedPrice).mul(100).toNumber() : 0,
  };
};

export const getServiceAddendumTotals = (items) => {
  const totals = items.reduce((sum, item) => {
    const quantity = new Decimal(item.quantity || 1);
    return {
      revenue: sum.revenue.plus(new Decimal(item.sellingPrice || 0).mul(quantity)),
      cost: sum.cost.plus(new Decimal(item.cost || 0).plus(item.budget || 0).mul(quantity)),
      budget: sum.budget.plus(new Decimal(item.budget || 0).mul(quantity)),
    };
  }, { revenue: new Decimal(0), cost: new Decimal(0), budget: new Decimal(0) });
  const profit = totals.revenue.minus(totals.cost);
  return Object.fromEntries(Object.entries({
    ...totals, profit, vat: totals.revenue.mul('0.08'), totalWithVat: totals.revenue.mul('1.08'),
    margin: totals.revenue.gt(0) ? profit.div(totals.revenue).mul(100) : new Decimal(0),
  }).map(([key, value]) => [key, value.toNumber()]));
};

export function validateNewServiceBudget(item, service) {
  const budget = new Decimal(item.budget || 0);
  if (!budget.isFinite() || !budget.isInteger() || budget.lt(0) || budget.gt(Number.MAX_SAFE_INTEGER)) {
    return 'Ngân sách phải là số nguyên đồng không âm hợp lệ';
  }
  if (service?.isBudget !== true && !budget.isZero()) return 'Dịch vụ không cho phép nhập ngân sách';
  return null;
}
