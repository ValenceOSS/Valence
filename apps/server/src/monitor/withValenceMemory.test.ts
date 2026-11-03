import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { withValenceMemory } from './withValenceMemory';

const ReadingSchema = z.object({
  resources: z.object({ apiMemoryBytes: z.number(), requestsMemoryBytes: z.number().nullable() }),
});

describe('withValenceMemory', () => {
  it('says what this process is holding, which the media service cannot see', () => {
    const reading = ReadingSchema.parse(
      withValenceMemory({ resources: { serviceMemoryBytes: 16 } }, null),
    );

    expect(reading.resources.apiMemoryBytes).toBeGreaterThan(0);
    expect(reading.resources.requestsMemoryBytes).toBeNull();
  });

  it('says what the requests service costs, browser and all, which lives in a container of its own', () => {
    const reading = ReadingSchema.parse(
      withValenceMemory({ resources: { serviceMemoryBytes: 16 } }, 3_200_000_000),
    );

    expect(reading.resources.requestsMemoryBytes).toBe(3_200_000_000);
  });

  it('leaves everything else in the reading alone', () => {
    expect(withValenceMemory({ sessions: 2, resources: { cpuCount: 4 } }, null)).toMatchObject({
      sessions: 2,
      resources: { cpuCount: 4 },
    });
  });

  it('hands back what it was given when the service said something else', () => {
    expect(withValenceMemory({ reachable: false }, 5)).toEqual({ reachable: false });
    expect(withValenceMemory(null, 5)).toBeNull();
    expect(withValenceMemory([1, 2], 5)).toEqual([1, 2]);
    expect(withValenceMemory({ resources: 'none' }, 5)).toEqual({ resources: 'none' });
  });
});
