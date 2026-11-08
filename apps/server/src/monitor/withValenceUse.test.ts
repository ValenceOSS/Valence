import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { withValenceUse } from './withValenceUse';

const ReadingSchema = z.object({
  resources: z.object({
    apiMemoryBytes: z.number(),
    apiCpuPercent: z.number().nullable(),
    requestsMemoryBytes: z.number().nullable(),
    requestsCpuPercent: z.number().nullable(),
  }),
});

const NOTHING = { requests: null, apiCpuPercent: null };

describe('withValenceUse', () => {
  it('says what this process is holding and using, which the media service cannot see', () => {
    const reading = ReadingSchema.parse(
      withValenceUse(
        { resources: { serviceMemoryBytes: 16 } },
        { requests: null, apiCpuPercent: 12 },
      ),
    );

    expect(reading.resources.apiMemoryBytes).toBeGreaterThan(0);
    expect(reading.resources.apiCpuPercent).toBe(12);
    expect(reading.resources.requestsMemoryBytes).toBeNull();
    expect(reading.resources.requestsCpuPercent).toBeNull();
  });

  it('says what the requests service costs, browser and all, which lives in a container of its own', () => {
    const reading = ReadingSchema.parse(
      withValenceUse(
        { resources: { serviceMemoryBytes: 16 } },
        { requests: { bytes: 3_200_000_000, cpuPercent: 80 }, apiCpuPercent: null },
      ),
    );

    expect(reading.resources.requestsMemoryBytes).toBe(3_200_000_000);
    expect(reading.resources.requestsCpuPercent).toBe(80);
  });

  it('leaves everything else in the reading alone', () => {
    expect(withValenceUse({ sessions: 2, resources: { cpuCount: 4 } }, NOTHING)).toMatchObject({
      sessions: 2,
      resources: { cpuCount: 4 },
    });
  });

  it('hands back what it was given when the service said something else', () => {
    expect(withValenceUse({ reachable: false }, NOTHING)).toEqual({ reachable: false });
    expect(withValenceUse(null, NOTHING)).toBeNull();
    expect(withValenceUse([1, 2], NOTHING)).toEqual([1, 2]);
    expect(withValenceUse({ resources: 'none' }, NOTHING)).toEqual({ resources: 'none' });
  });
});
