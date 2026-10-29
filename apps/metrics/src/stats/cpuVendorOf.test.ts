import { describe, expect, it } from 'vitest';
import { cpuVendorOf } from './cpuVendorOf';

describe('cpuVendorOf', () => {
  it.each([
    ['AMD Ryzen 7 5800X 8-Core Processor', 'amd'],
    ['AMD EPYC 7302P 16-Core Processor', 'amd'],
    ['Intel(R) Core(TM) i5-12400 CPU @ 2.50GHz', 'intel'],
    ['Intel(R) N100', 'intel'],
    ['Apple M2 Pro', 'apple'],
    ['M1', 'apple'],
    ['Cortex-A76', 'arm'],
    ['ARMv8 Processor rev 1 (v8l)', 'arm'],
    ['Neoverse-N1', 'arm'],
    ['', 'other'],
    ['QEMU Virtual CPU version 2.5+', 'other'],
  ] as const)('reads %s as made by %s', (model, vendor) => {
    expect(cpuVendorOf(model)).toBe(vendor);
  });
});
