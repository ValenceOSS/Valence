import { describe, expect, it } from 'vitest';
import { createMemoryCalendarFeedService } from './createMemoryCalendarFeedService';

const ADA = { accountId: 'ada', profileId: 'ada-face' };

describe('createMemoryCalendarFeedService', () => {
  it('hands back the same link, notes when it is read, and replaces it when renewed', async () => {
    const service = createMemoryCalendarFeedService(() => new Date('2026-10-02T10:00:00.000Z'));
    const first = await service.ensure(ADA);

    expect((await service.ensure(ADA)).token).toBe(first.token);
    expect(await service.resolve(first.token ?? '')).toEqual(ADA);
    expect((await service.read(ADA))?.lastReadAt).toBe('2026-10-02T10:00:00.000Z');

    const second = await service.renew(ADA);

    expect(await service.resolve(first.token ?? '')).toBeNull();
    expect(await service.resolve(second.token ?? '')).toEqual(ADA);
  });

  it('turns a link off, saying whether there was one', async () => {
    const service = createMemoryCalendarFeedService();
    const { token } = await service.ensure(ADA);

    expect(await service.stop(ADA)).toBe(true);
    expect(await service.resolve(token ?? '')).toBeNull();
    expect(await service.stop(ADA)).toBe(false);
    expect(await service.read(ADA)).toBeNull();
  });
});
