import { describe, expect, it } from 'vitest';
import { ArrCommandSchema } from './ArrCommandSchema';

describe('ArrCommandSchema', () => {
  it('reads the command an app queued', () => {
    expect(
      ArrCommandSchema.parse({
        name: 'MoviesSearch',
        commandName: 'Movies Search',
        body: { movieIds: [12], sendUpdatesToClient: true },
        priority: 'normal',
        status: 'queued',
        queued: '2026-10-01T09:00:00Z',
        trigger: 'manual',
        id: 381,
      }),
    ).toEqual({ id: 381, name: 'MoviesSearch' });
  });
});
