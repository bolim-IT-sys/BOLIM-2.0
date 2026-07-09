export function calculateInventoryMetrics(
  stock: number,
  totalUsage: number,
  monthsUsed: number,
) {
  const avgMonthlyUsage = monthsUsed > 0 ? totalUsage / monthsUsed : 0;

  const safetyStock = Math.ceil(Math.max(avgMonthlyUsage * 2, 10) / 10) * 10;

  const securementRate =
    safetyStock > 1 ? Number((stock / safetyStock).toFixed(2)) : 0;

  const excessShortage = stock - safetyStock;

  const regularOrderQty =
    securementRate < 1 ? Math.ceil(-excessShortage / 10) * 10 : 0;

  return {
    avgMonthlyUsage,
    safetyStock,
    securementRate,
    excessShortage,
    regularOrderQty,
  };
}
