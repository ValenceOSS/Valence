const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Works out the size somebody would say out loud for a number of bytes: the number and the unit it
 * is in, with as many decimal places as it needs to read honestly — one below ten, so that 1.4 GB
 * does not read as 1 GB, and none otherwise. Anything negative, infinite or not a number is no size
 * at all rather than nonsense.
 *
 * @param bytes - The size to describe.
 * @returns The number, its unit, and how many decimal places it is written with.
 */
const sizeOfBytes = (bytes: number): { value: number; unit: string; decimals: number } => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return { value: 0, unit: 'B', decimals: 0 };
  }

  const step = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** step;
  const decimals = value < 10 && step > 0 ? 1 : 0;

  return {
    value: decimals === 1 ? Number(value.toFixed(1)) : Math.round(value),
    unit: UNITS[step] ?? 'B',
    decimals,
  };
};

export { sizeOfBytes };
