import { sizeOfBytes } from '@ValenceCore/functions/sizeOfBytes';

/**
 * Formats a number of bytes as a size somebody would say out loud, stepping up through B, KB, MB,
 * GB and TB and keeping one decimal place below ten so that 1.4 GB does not read as 1 GB. Anything
 * negative, infinite or not a number is reported as no size at all rather than as nonsense.
 *
 * @param bytes - The size to describe.
 * @returns The size and its unit, such as `1.4 GB`.
 */
const formatBytes = (bytes: number): string => {
  const { value, unit, decimals } = sizeOfBytes(bytes);

  return `${value.toFixed(decimals)} ${unit}`;
};

export { formatBytes };
