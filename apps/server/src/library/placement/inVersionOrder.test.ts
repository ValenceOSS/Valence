import { describe, expect, it } from 'vitest';
import { inVersionOrder } from './inVersionOrder';

describe('inVersionOrder', () => {
  it('puts the highest resolution first, and names without one after, by name', () => {
    expect(
      inVersionOrder([
        '/m/Heat - Theatrical.mkv',
        '/m/Heat - 720p.mkv',
        '/m/Heat - 2160p.mkv',
        '/m/Heat - Extended.mkv',
      ]),
    ).toEqual([
      '/m/Heat - 2160p.mkv',
      '/m/Heat - 720p.mkv',
      '/m/Heat - Extended.mkv',
      '/m/Heat - Theatrical.mkv',
    ]);
  });
});
