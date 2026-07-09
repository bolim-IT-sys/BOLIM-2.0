interface SerialData {
  received_date?: string | Date | null;
  deployed_date?: string | Date | null;
}

export function calculateAssetUsage(serials: SerialData[], year: number) {
  let totalOutbound = 0;
  const usedMonths = new Set<number>();

  serials.forEach((serial) => {
    if (serial.deployed_date) {
      const deployedDate = new Date(serial.deployed_date);
      if (deployedDate.getFullYear() === year) {
        totalOutbound += 1;
        usedMonths.add(deployedDate.getMonth());
      }
    }
  });

  return {
    totalUsage: totalOutbound,
    monthsUsed: usedMonths.size,
  };
}
