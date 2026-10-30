import { Fragment, useMemo, useState } from 'react';
import { Decimal } from 'decimal.js';
import { ChevronDown, ChevronUp, Coins, Trash2 } from 'lucide-react';
import { formatNumber, parseNumber } from '../../utils/format';
import { canEditServiceBudget, isServiceBudgetEligible, budgetLockedMessage } from './serviceBudget';

export const normalizeServiceJobs = (jobs = []) => jobs.map((serviceJob) => {
  const job = serviceJob.job || serviceJob;
  return {
    id: serviceJob.id || job.id || serviceJob.jobId,
    name: serviceJob.name || serviceJob.jobName || job.name || 'Hạng mục',
    quantity: Number(serviceJob.quantity || 1),
    unit: job.unit || serviceJob.unit || '',
    costAtSale: Number(serviceJob.costAtSale ?? serviceJob.unitCost ?? job.costPrice ?? 0),
    isQuotationItem: serviceJob.isQuotationItem ?? job.isQuotationItem ?? true,
    isBriefVideo: Boolean(serviceJob.isBriefVideo ?? job.isBriefVideo),
    isOutput: Boolean(serviceJob.isOutput),
  };
});

export const roundToTenThousands = (value) => Math.ceil(Number(value || 0) / 10000) * 10000;

export const getEffectiveCostPrice = (item = {}) => new Decimal(item.costPrice || 0).plus(item.budget || 0).toNumber();

export const calculateProfitMargin = (sellingPrice, costPrice, budget = 0) => {
  if (!Number(sellingPrice)) return 0;
  return new Decimal(sellingPrice).minus(costPrice || 0).minus(budget || 0).div(sellingPrice).mul(100).toNumber();
};

export const getServicePricingTotals = (items = []) => items.reduce((totals, item) => {
  const revenue = new Decimal(item.selectedPrice || 0).mul(item.quantity || 0);
  const cost = new Decimal(item.costPrice || 0).plus(item.budget || 0).mul(item.quantity || 0);
  return {
    revenue: new Decimal(totals.revenue).plus(revenue).toNumber(),
    cost: new Decimal(totals.cost).plus(cost).toNumber(),
    vat: new Decimal(totals.vat).plus(revenue.mul('0.08')).toNumber(),
    totalWithVat: new Decimal(totals.totalWithVat).plus(revenue.mul('1.08')).toNumber(),
  };
}, { revenue: 0, cost: 0, vat: 0, totalWithVat: 0 });

export const QuotationServicePricingTable = ({
  items,
  setItems,
  priceType: requestedPriceType,
  setPriceType,
  servicesById = new Map(),
  mode = 'edit',
  disabled = false,
  customOnly = false,
  minimumItems = 0,
  emptyMessage = 'Chưa có dịch vụ.',
  children,
}) => {
  const [expandedRows, setExpandedRows] = useState({ packages: {}, services: {} });
  const priceType = customOnly ? 'custom' : requestedPriceType;
  const canEditPrices = mode !== 'readonly' && !disabled;
  const canEditStructure = mode === 'edit' && !disabled;
  const showActions = canEditStructure;
  const columnCount = (priceType === 'custom' ? 10 : 9) - (customOnly ? 2 : 0) + (showActions ? 1 : 0);

  const totals = useMemo(() => getServicePricingTotals(items), [items]);
  const overallProfitMargin = totals.revenue > 0
    ? ((totals.revenue - totals.cost) / totals.revenue) * 100
    : 0;

  const displayGroups = useMemo(() => {
    const packages = {};
    const standalone = [];
    items.forEach((item, index) => {
      const packageName = item.packageName || 'STANDALONE';
      const jobs = item.jobs?.length
        ? normalizeServiceJobs(item.jobs)
        : normalizeServiceJobs(servicesById.get(String(item.serviceId))?.serviceJobs || []);
      const normalizedItem = { ...item, jobs, originalIndex: index };
      if (packageName === 'STANDALONE') {
        standalone.push(normalizedItem);
        return;
      }

      const key = String(item.packageKey || item.servicePackageId || packageName);
      if (!packages[key]) {
        packages[key] = {
          key,
          name: packageName,
          quantity: Number(item.packageQuantity || 1),
          costPrice: 0,
          minPrice: 0,
          recommendedPrice: 0,
          customPrice: 0,
          selectedPrice: 0,
          items: [],
        };
      }
      const norm = Number(item.norm || 1);
      packages[key].costPrice += getEffectiveCostPrice(item) * norm;
      packages[key].minPrice += Number(item.minPrice || 0) * norm;
      packages[key].recommendedPrice += Number(item.recommendedPrice || 0) * norm;
      packages[key].customPrice += Number(item.customPrice || 0) * norm;
      packages[key].selectedPrice += Number(item.selectedPrice || 0) * norm;
      packages[key].items.push(normalizedItem);
    });

    return {
      packages: Object.values(packages).map((pkg) => {
        const revenue = pkg.selectedPrice * pkg.quantity;
        return {
          ...pkg,
          profitMargin: calculateProfitMargin(pkg.selectedPrice, pkg.costPrice),
          vat: revenue * 0.08,
          totalWithVat: revenue * 1.08,
        };
      }),
      standalone,
    };
  }, [items, servicesById]);

  const toggleExpanded = (level, key) => setExpandedRows((previous) => ({
    ...previous,
    [level]: { ...previous[level], [key]: !previous[level][key] },
  }));

  const handlePriceTypeChange = (type) => {
    if (customOnly) return;
    setPriceType(type);
    setItems((previous) => previous.map((item) => {
      const selectedPrice = type === 'minimum'
        ? item.minPrice
        : type === 'recommended'
          ? item.recommendedPrice
          : item.customPrice;
      return { ...item, selectedPrice, profitMargin: calculateProfitMargin(selectedPrice, item.costPrice, item.budget) };
    }));
  };

  const handleCustomPriceChange = (index, value) => {
    const enteredPrice = parseNumber(value);
    setItems((previous) => previous.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const norm = item.packageName !== 'STANDALONE' ? Number(item.norm || 1) : 1;
      const customPrice = enteredPrice / norm;
      return {
        ...item,
        customPrice,
        selectedPrice: customPrice,
        profitMargin: calculateProfitMargin(customPrice, item.costPrice, item.budget),
      };
    }));
  };

  const handleBudgetChange = (index, value) => {
    const budget = parseNumber(value);
    setItems((previous) => previous.map((item, itemIndex) => itemIndex === index && canEditServiceBudget(item, servicesById, canEditPrices)
      ? (() => {
        const totalCost = new Decimal(item.costPrice || 0).plus(budget || 0);
        const minPrice = totalCost.div('0.8').div(10000).ceil().mul(10000).toNumber();
        const recommendedPrice = totalCost.div('0.6').div(10000).ceil().mul(10000).toNumber();
        const selectedPrice = priceType === 'minimum'
          ? minPrice
          : priceType === 'recommended'
            ? recommendedPrice
            : item.selectedPrice;

        return {
          ...item,
          budget,
          minPrice,
          recommendedPrice,
          selectedPrice,
          profitMargin: calculateProfitMargin(selectedPrice, item.costPrice, budget),
        };
      })()
      : item));
  };

  const handlePackageCustomPriceChange = (packageKey, value) => {
    const totalPrice = parseNumber(value);

    setItems((previous) => {
      const indexes = previous.reduce((result, item, index) => (

      String(item.packageKey || item.servicePackageId || item.packageName) === String(packageKey) ? [...result, index] : result
    ), []);
    if (indexes.length === 0) return;
    const weights = indexes.map((index) => {
      const item = previous[index];
      return Number(item.recommendedPrice || item.costPrice || 1) * Number(item.norm || 1);
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let allocated = 0;

    return previous.map((item, index) => {
      const position = indexes.indexOf(index);
      if (position < 0) return item;
      const linePrice = position === indexes.length - 1
        ? Math.max(0, totalPrice - allocated)
        : Math.round(totalPrice * (totalWeight > 0 ? weights[position] / totalWeight : 1 / indexes.length));
      allocated += linePrice;
      const customPrice = linePrice / Number(item.norm || 1);
      return {
        ...item,
        customPrice,
        selectedPrice: customPrice,
        profitMargin: calculateProfitMargin(customPrice, item.costPrice, item.budget),
      };
      });
    });
  };

  const handlePackageQuantityChange = (packageKey, value) => {
    const quantity = parseInt(value, 10) || 1;
    setItems((previous) => previous.map((item) => String(item.packageKey || item.servicePackageId || item.packageName) === String(packageKey)
      ? { ...item, packageQuantity: quantity, quantity: Number(item.norm || 1) * quantity }
      : item));
  };

  const handleStandaloneQuantityChange = (index, value) => {
    const quantity = parseInt(value, 10) || 1;
    setItems((previous) => previous.map((item, itemIndex) => itemIndex === index
      ? { ...item, quantity }
      : item));
  };

  const renderJobRows = (item, serviceKey, packageItem = false) => item.jobs.map((job, jobIndex) => (
    <tr key={`${serviceKey}:job:${job.id || jobIndex}`} className={`border-b ${packageItem ? 'border-indigo-50 bg-indigo-50/20' : 'border-gray-100 bg-gray-50/80'}`}>
      <td className={`sticky left-0 z-10 border-r py-2 pr-4 text-xs text-gray-600 ${packageItem ? 'border-indigo-50 bg-indigo-50/20 pl-16' : 'border-gray-100 bg-gray-50/80 pl-12'}`}>
        <div className="flex items-center gap-2">
          <span className={packageItem ? 'text-indigo-300' : 'text-gray-300'}>└</span>
          <span>{job.name}</span>
          {(job.isBriefVideo || !job.isQuotationItem) && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">Không tính báo giá</span>}
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-center text-[11px] text-gray-500">{job.quantity} {job.unit}</td>
      <td className="px-4 py-2 text-right text-xs text-gray-500" title="Giá vốn hạng mục này đã được tính trong giá vốn dịch vụ">{formatNumber(job.costAtSale)}</td>
      <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
      {!customOnly && <>
      <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
      <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
      </>}
      {priceType === 'custom' && <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>}
      <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
      <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
      <td className="px-4 py-2 text-center text-xs text-gray-300">—</td>
      {showActions && <td />}
    </tr>
  ));

  return (
    <>
      <div className="mb-6 overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className={`w-full border-collapse ${customOnly ? 'min-w-[1100px]' : 'min-w-[1450px]'}`}>
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="sticky left-0 z-10 w-[250px] border-r border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700">Hạng mục</th>
            <th className="w-[100px] px-4 py-3 text-center text-sm font-semibold text-gray-700">Số lượng</th>
            <th className="w-[120px] px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá vốn</th>
            <th className="w-[150px] px-4 py-3 text-right text-sm font-semibold text-gray-700">Ngân sách</th>
            {!customOnly && <th className="w-[150px] px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá bán tối thiểu</th>}
            {!customOnly && <th className="w-[150px] px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá bán đề xuất</th>}
            {priceType === 'custom' && <th className="w-[180px] px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá bán tùy chỉnh</th>}
            <th className="w-[150px] px-4 py-3 text-right text-sm font-semibold text-gray-700">Tỉ suất lợi nhuận</th>
            <th className="w-[120px] px-4 py-3 text-right text-sm font-semibold text-gray-700">VAT (8%)</th>
            <th className="w-[150px] px-4 py-3 text-right text-sm font-semibold text-gray-700">Thành tiền</th>
            {showActions && <th className="w-[100px] px-4 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>}
          </tr></thead>
          <tbody>
            {displayGroups.packages.map((pkg) => {
              const packageOpen = Boolean(expandedRows.packages[pkg.key]);
              const packageHasBudget = pkg.items.some((item) => isServiceBudgetEligible(item, servicesById));
              const packageBudget = pkg.items.reduce((sum, item) => sum + Number(item.budget || 0) * Number(item.norm || 1), 0);
              return <Fragment key={pkg.key}>
                <tr className="border-b border-blue-100 bg-blue-50/50">
                  <td className="sticky left-0 z-10 border-r border-blue-100 bg-blue-50/50 px-4 py-2 text-sm font-bold text-blue-900">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => toggleExpanded('packages', pkg.key)} className="rounded p-1 text-blue-600 hover:bg-blue-100">
                        {packageOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white">Gói</span>
                      <span>{pkg.name}</span>
                      {packageHasBudget && (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 shadow-2xs" title="Gói này chứa dịch vụ cho phép cấu hình ngân sách">
                          <Coins className="h-3 w-3 text-amber-600" />
                          Gói có ngân sách
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">{canEditStructure ? <><input type="number" min="1" value={pkg.quantity} onChange={(event) => handlePackageQuantityChange(pkg.key, event.target.value)} className="w-10 rounded border-2 border-blue-200 bg-white py-1 text-center text-sm font-bold text-blue-900" /><span className="ml-1 text-[10px] font-black uppercase text-blue-400">Gói</span></> : <span className="font-bold text-blue-900">{pkg.quantity} Gói</span>}</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-blue-900">{formatNumber(pkg.costPrice)}</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-blue-900">
                    {packageHasBudget ? (
                      packageBudget > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-amber-900 font-extrabold">{formatNumber(packageBudget)}</span>
                          <span className="text-[10px] text-amber-700 font-semibold">đ</span>
                        </div>
                      ) : (
                        <span>0 đ</span>
                      )
                    ) : (
                      packageBudget > 0 ? `${formatNumber(packageBudget)} đ` : <span className="text-gray-300 font-normal">—</span>
                    )}
                  </td>
                  {!customOnly && <><td className="px-4 py-2 text-right text-sm text-blue-700">{formatNumber(pkg.minPrice)}</td></>}
                  {!customOnly && <><td className="px-4 py-2 text-right text-sm text-blue-700">{formatNumber(pkg.recommendedPrice)}</td></>}
                  {priceType === 'custom' && <td className="px-3 py-1.5 text-right">{canEditPrices ? <input type="text" aria-label={`Giá tùy chỉnh gói ${pkg.name}`} value={formatNumber(pkg.customPrice)} onChange={(event) => handlePackageCustomPriceChange(pkg.key, event.target.value)} className="w-36 rounded-lg border-2 border-blue-300 bg-white px-2 py-1 text-right text-sm font-bold text-blue-900 outline-none focus:border-blue-600" /> : <span className="font-bold text-blue-900">{formatNumber(pkg.customPrice)}</span>}</td>}
                  <td className={`px-4 py-2 text-right text-sm font-black ${pkg.profitMargin < 0 ? 'text-red-600' : 'text-blue-600'}`}>{pkg.profitMargin.toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-blue-900">{formatNumber(pkg.vat)}</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-blue-900">{formatNumber(pkg.totalWithVat)}</td>
                  {showActions && <td className="px-4 py-2 text-center"><button type="button" onClick={() => setItems((previous) => previous.filter((item) => String(item.packageKey || item.servicePackageId || item.packageName) !== String(pkg.key)))} className="rounded p-1.5 text-red-400 hover:bg-white"><Trash2 className="h-4 w-4" /></button></td>}
                </tr>
                {packageOpen && pkg.items.map((item) => {
                  const norm = Number(item.norm || 1);
                  const serviceKey = `package:${pkg.key}:${item.key || item.serviceId}:${item.originalIndex}`;
                  const serviceOpen = Boolean(expandedRows.services[serviceKey]);
                  const isBudgetAllowed = isServiceBudgetEligible(item, servicesById);
                  const hasBudgetInput = Number(item.budget || 0) > 0;
                  return <Fragment key={serviceKey}>
                    <tr className="border-b border-gray-50 bg-blue-50/10">
                      <td className="sticky left-0 z-10 border-r border-blue-50 bg-white py-2 pl-10 pr-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          {item.jobs.length > 0 ? (
                            <button type="button" onClick={() => toggleExpanded('services', serviceKey)} className="rounded p-1 text-indigo-500">
                              {serviceOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          ) : (
                            <span className="w-5 text-center text-gray-300">•</span>
                          )}
                          <span className="italic">{item.serviceName}</span>
                          {isBudgetAllowed && (
                            <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 shrink-0" title="Dịch vụ cho phép cấu hình ngân sách">
                              <Coins className="h-3 w-3 text-amber-600" />
                              Có ngân sách
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-center text-[11px] text-gray-500">{item.norm} {item.unit ? `${item.unit} / gói` : '/ gói'}</td>
                      <td className="px-4 py-2 text-right text-sm text-gray-600">{formatNumber(getEffectiveCostPrice(item) * norm)}</td>
                      <td className="px-4 py-1.5">
                        {isBudgetAllowed ? (
                          canEditPrices ? (
                            <input
                              type="text"
                              aria-label={`Ngân sách ${item.serviceName}`}
                              value={formatNumber(item.budget || 0)}
                              onChange={(event) => handleBudgetChange(item.originalIndex, event.target.value)}
                              className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-right text-sm font-semibold text-gray-900 outline-none transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                              title="Dịch vụ cho phép cấu hình ngân sách"
                            />
                          ) : (
                            <div className="text-right text-sm font-bold text-gray-900">
                              {formatNumber(item.budget || 0)} đ
                            </div>
                          )
                        ) : (
                          <div className="text-center text-xs text-gray-300 font-medium" title="Dịch vụ không cấu hình ngân sách">—</div>
                        )}
                      </td>
                      {!customOnly && <><td className="px-4 py-2 text-right text-sm text-gray-600">{formatNumber(item.minPrice * norm)}</td><td className="px-4 py-2 text-right text-sm text-gray-600">{formatNumber(item.recommendedPrice * norm)}</td></>}
                      {priceType === 'custom' && <td className="px-4 py-1.5">{canEditPrices ? <input type="text" aria-label={`Giá tùy chỉnh ${item.serviceName}`} value={formatNumber(item.customPrice * norm)} onChange={(event) => handleCustomPriceChange(item.originalIndex, event.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm" /> : <div className="text-right text-sm">{formatNumber(item.customPrice * norm)}</div>}</td>}
                      <td className={`px-4 py-2 text-right text-sm ${item.profitMargin < 0 ? 'text-red-600' : 'text-blue-600'}`}>{Number(item.profitMargin || 0).toFixed(0)}%</td><td className="px-4 py-2 text-right text-sm">{formatNumber(item.selectedPrice * norm * 0.08)}</td><td className="px-4 py-2 text-right text-sm font-semibold">{formatNumber(item.selectedPrice * norm * 1.08)}</td>{showActions && <td />}
                    </tr>
                    {serviceOpen && renderJobRows(item, serviceKey, true)}
                  </Fragment>;
                })}
              </Fragment>;
            })}
            {displayGroups.standalone.length > 0 && <>
              <tr className="border-b border-gray-200 bg-gray-100"><td colSpan={columnCount} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">Dịch vụ lẻ</td></tr>
              {displayGroups.standalone.map((item) => {
                const serviceKey = `standalone:${item.key || item.serviceId}:${item.originalIndex}`;
                const serviceOpen = Boolean(expandedRows.services[serviceKey]);
                const isBudgetAllowed = isServiceBudgetEligible(item, servicesById);
                const hasBudgetInput = Number(item.budget || 0) > 0;
                return <Fragment key={serviceKey}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="sticky left-0 z-10 border-r border-gray-100 bg-white px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {item.jobs.length > 0 ? (
                          <button type="button" onClick={() => toggleExpanded('services', serviceKey)} className="rounded p-1 text-gray-500">{serviceOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button>
                        ) : (
                          <span className="w-5 text-center text-gray-300">•</span>
                        )}
                        <span>{item.serviceName}</span>
                        {isBudgetAllowed && (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 shrink-0" title="Dịch vụ cho phép cấu hình ngân sách">
                            <Coins className="h-3 w-3 text-amber-600" />
                            Có ngân sách
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">{canEditStructure ? <div className="flex items-center justify-center gap-1"><input type="number" min="1" value={item.quantity} onChange={(event) => handleStandaloneQuantityChange(item.originalIndex, event.target.value)} className="w-10 rounded border border-gray-300 py-1 text-center text-sm" /><span className="text-[10px] font-bold uppercase text-gray-400">{item.unit}</span></div> : <span className="font-bold">{item.quantity} {item.unit}</span>}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatNumber(getEffectiveCostPrice(item))}</td>
                    <td className="px-4 py-3">
                      {isBudgetAllowed ? (
                        canEditPrices ? (
                          <input
                            type="text"
                            aria-label={`Ngân sách ${item.serviceName}`}
                            value={formatNumber(item.budget || 0)}
                            onChange={(event) => handleBudgetChange(item.originalIndex, event.target.value)}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-right text-sm font-semibold text-gray-900 outline-none transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            title="Dịch vụ cho phép cấu hình ngân sách"
                          />
                        ) : (
                          <div className="text-right text-sm font-bold text-gray-900">
                            {formatNumber(item.budget || 0)} đ
                          </div>
                        )
                      ) : (
                        <div className="text-center text-xs text-gray-300 font-medium" title="Dịch vụ không cấu hình ngân sách">—</div>
                      )}
                    </td>
                    {!customOnly && <><td className="px-4 py-3 text-right text-sm">{formatNumber(item.minPrice)}</td><td className="px-4 py-3 text-right text-sm">{formatNumber(item.recommendedPrice)}</td></>}
                    {priceType === 'custom' && <td className="px-4 py-3">{canEditPrices ? <input type="text" aria-label={`Giá tùy chỉnh ${item.serviceName}`} value={formatNumber(item.customPrice)} onChange={(event) => handleCustomPriceChange(item.originalIndex, event.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm" /> : <div className="text-right text-sm">{formatNumber(item.customPrice)}</div>}</td>}
                    <td className={`px-4 py-3 text-right text-sm ${item.profitMargin < 0 ? 'text-red-600' : 'text-blue-600'}`}>{Number(item.profitMargin || 0).toFixed(0)}%</td><td className="px-4 py-3 text-right text-sm">{formatNumber(item.selectedPrice * item.quantity * 0.08)}</td><td className="px-4 py-3 text-right text-sm font-bold">{formatNumber(item.selectedPrice * item.quantity * 1.08)}</td>
                    {showActions && <td className="px-4 py-3 text-center"><button type="button" disabled={items.length <= minimumItems} onClick={() => setItems((previous) => previous.filter((_, index) => index !== item.originalIndex))} className="rounded p-1.5 text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></td>}
                  </tr>
                  {serviceOpen && renderJobRows(item, serviceKey)}
                </Fragment>;
              })}
            </>}
            {items.length === 0 && <tr><td colSpan={columnCount} className="px-4 py-10 text-center text-sm italic text-gray-400">{emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>

      {canEditStructure && children}
      {canEditPrices && !customOnly && <div className="mb-6 flex flex-wrap gap-4">{[['recommended', 'Chọn giá bán đề xuất'], ['minimum', 'Chọn giá bán tối thiểu'], ['custom', 'Chọn giá bán tùy chỉnh']].map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2"><input type="radio" name="service-pricing-type" value={value} checked={priceType === value} onChange={(event) => handlePriceTypeChange(event.target.value)} className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium text-gray-700">{label}</span></label>)}</div>}
      <div className="mb-6 rounded-lg bg-blue-50 p-4"><div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div><p className="mb-1 text-sm text-blue-700">Tổng doanh thu:</p><p className="text-xl font-bold text-blue-900">{formatNumber(Math.round(totals.revenue))}</p></div><div><p className="mb-1 text-sm text-blue-700">Tổng VAT (8%):</p><p className="text-xl font-bold text-blue-900">{formatNumber(Math.round(totals.vat))}</p></div><div><p className="mb-1 text-sm text-blue-700">Tổng cộng (có VAT):</p><p className="text-xl font-bold text-blue-900">{formatNumber(Math.round(totals.totalWithVat))}</p></div><div><p className="mb-1 text-sm text-blue-700">Tổng vốn:</p><p className="text-xl font-bold text-blue-900">{formatNumber(Math.round(totals.cost))}</p></div><div><p className={`mb-1 text-sm ${totals.revenue - totals.cost < 0 ? 'text-red-700' : 'text-blue-700'}`}>Tổng lợi nhuận:</p><p className="text-xl font-bold text-blue-900">{formatNumber(Math.round(totals.revenue - totals.cost))}</p></div><div><p className="mb-1 text-sm text-blue-700">Tỉ suất lợi nhuận:</p><p className="text-xl font-bold text-blue-900">{Math.round(overallProfitMargin)}%</p></div>
      </div></div>
    </>
  );
};
