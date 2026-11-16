import { describe, expect, it } from 'vitest';
import { CastingNowSchema } from './CastingNow';

const LIVING_ROOM = {
  id: 'Chromecast-1._googlecast._tcp.local.',
  name: 'Living Room TV',
  model: 'Chromecast',
};

describe('CastingNowSchema', () => {
  it('reads where casting stands as the desktop app says it', () => {
    const said = { state: 'connected', devices: [LIVING_ROOM], device: LIVING_ROOM };

    expect(CastingNowSchema.parse(said)).toEqual(said);
  });

  it('reads a device that does not say what it is', () => {
    const unnamed = { ...LIVING_ROOM, model: null };

    expect(
      CastingNowSchema.parse({ state: 'available', devices: [unnamed], device: null }).devices,
    ).toEqual([unnamed]);
  });

  it('refuses a state it does not know', () => {
    expect(
      CastingNowSchema.safeParse({ state: 'casting', devices: [], device: null }).success,
    ).toBe(false);
  });
});
