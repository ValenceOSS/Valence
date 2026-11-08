import { describe, expect, it } from 'vitest';
import type { Monitor } from '@ValenceClient/admin/fetchAdmin';
import { valenceMemoryUse } from './valenceMemoryUse';

const resources = (overrides: Partial<Monitor['resources']> = {}): Monitor['resources'] => ({
  atMs: 0,
  systemCpuPercent: 0,
  systemMemoryUsedBytes: 0,
  systemMemoryTotalBytes: 0,
  cpuCount: 4,
  cpuPercents: [],
  cpuSpeedsMhz: [],
  serviceCpuPercent: 0,
  serviceMemoryBytes: 0,
  children: [],
  deploymentMemory: null,
  apiMemoryBytes: null,
  requestsMemoryBytes: null,
  deploymentCpuPercent: null,
  apiCpuPercent: null,
  requestsCpuPercent: null,
  loadAverage: 0,
  disks: [],
  drives: [],
  graphics: null,
  graphicsNotes: [],
  artefacts: null,
  ...overrides,
});

const conversion = (memoryBytes: number) => ({ pid: 1, cpuPercent: 0, memoryBytes });

describe('valenceMemoryUse', () => {
  it('has nothing to say before the first reading', () => {
    expect(valenceMemoryUse(null)).toBeNull();
  });

  it('counts the conversions, not just the service', () => {
    expect(
      valenceMemoryUse(
        resources({
          serviceMemoryBytes: 16 * 1024 ** 2,
          children: [conversion(200 * 1024 ** 2), conversion(140 * 1024 ** 2)],
        }),
      ),
    ).toBe(356 * 1024 ** 2);
  });

  it('counts the API server, which is the half that allocates most', () => {
    expect(
      valenceMemoryUse(
        resources({ serviceMemoryBytes: 16 * 1024 ** 2, apiMemoryBytes: 300 * 1024 ** 2 }),
      ),
    ).toBe(316 * 1024 ** 2);
  });

  it('takes the deployment whole rather than adding its parts up twice', () => {
    expect(
      valenceMemoryUse(
        resources({
          serviceMemoryBytes: 16 * 1024 ** 2,
          apiMemoryBytes: 300 * 1024 ** 2,
          children: [conversion(200 * 1024 ** 2)],
          deploymentMemory: { usedBytes: 900 * 1024 ** 2, limitBytes: null },
        }),
      ),
    ).toBe(900 * 1024 ** 2);
  });

  it('adds the requests service, which is a container of its own with a browser in it', () => {
    expect(
      valenceMemoryUse(
        resources({
          deploymentMemory: { usedBytes: 2800 * 1024 ** 2, limitBytes: null },
          requestsMemoryBytes: 3200 * 1024 ** 2,
        }),
      ),
    ).toBe(6000 * 1024 ** 2);
  });

  it('adds the requests service to the processes it can see where the deployment cannot be read', () => {
    expect(
      valenceMemoryUse(
        resources({
          serviceMemoryBytes: 16 * 1024 ** 2,
          apiMemoryBytes: 300 * 1024 ** 2,
          requestsMemoryBytes: 700 * 1024 ** 2,
        }),
      ),
    ).toBe(1016 * 1024 ** 2);
  });

  it('leaves the requests service out where the card weighs one limited container against its limit', () => {
    expect(
      valenceMemoryUse(
        resources({
          deploymentMemory: { usedBytes: 2800 * 1024 ** 2, limitBytes: 4096 * 1024 ** 2 },
          requestsMemoryBytes: 3200 * 1024 ** 2,
        }),
      ),
    ).toBe(2800 * 1024 ** 2);
  });

  it('counts Valence without the requests service where that service has said nothing', () => {
    expect(
      valenceMemoryUse(
        resources({
          deploymentMemory: { usedBytes: 2800 * 1024 ** 2, limitBytes: null },
          requestsMemoryBytes: Number.NaN,
        }),
      ),
    ).toBe(2800 * 1024 ** 2);
  });

  it('reports an idle Valence as idle rather than as unmeasured', () => {
    expect(valenceMemoryUse(resources())).toBe(0);
  });

  it('refuses a reading it cannot make sense of', () => {
    expect(valenceMemoryUse(resources({ serviceMemoryBytes: Number.NaN }))).toBeNull();
  });

  it('falls back to the processes it can see when the deployment reading makes no sense', () => {
    expect(
      valenceMemoryUse(
        resources({
          serviceMemoryBytes: 5,
          deploymentMemory: { usedBytes: Number.NaN, limitBytes: null },
        }),
      ),
    ).toBe(5);
  });
});
