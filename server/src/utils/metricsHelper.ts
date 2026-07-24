export function calculateInventoryMetrics(
  stock: number,
  totalUsage: number,
  monthsUsed: number,
) {
  const avgMonthlyUsage = monthsUsed > 0 ? totalUsage / monthsUsed : 0;

  const safetyStock = Math.ceil(Math.max(avgMonthlyUsage * 2, 10) / 10) * 10;

  const rawSecurementRate = safetyStock > 1 ? stock / safetyStock : 0;
  const securementRate = Number(rawSecurementRate.toFixed(2));

  const excessShortage = stock - safetyStock;

  const regularOrderQty =
    rawSecurementRate < 1 ? Math.ceil(-excessShortage / 10) * 10 : 0;

  return {
    avgMonthlyUsage,
    safetyStock,
    securementRate,
    excessShortage,
    regularOrderQty,
  };
}
