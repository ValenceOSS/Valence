const CPU_VENDORS = ['amd', 'intel', 'apple', 'arm', 'other'] as const;

type CpuVendor = (typeof CPU_VENDORS)[number];

const MAKERS: readonly [CpuVendor, RegExp][] = [
  ['apple', /\bapple\b|^m\d\b/iu],
  ['amd', /\bamd\b|ryzen|epyc|threadripper|athlon|opteron/iu],
  ['intel', /intel|xeon|celeron|pentium|\bcore\(tm\)|\batom\b/iu],
  [
    'arm',
    /\barm|cortex|neoverse|ampere|graviton|snapdragon|qualcomm|broadcom|bcm\d|rockchip|allwinner/iu,
  ],
];

/**
 * Works out who made a processor from the model name its system reports.
 *
 * @param model - The model name, such as "AMD Ryzen 7 5800X 8-Core Processor".
 * @returns The maker, or "other" where the name does not say.
 */
const cpuVendorOf = (model: string): CpuVendor =>
  MAKERS.find(([, name]) => name.test(model))?.[0] ?? 'other';

export type { CpuVendor };

export { CPU_VENDORS, cpuVendorOf };
