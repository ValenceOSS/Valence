import { describe, expect, it } from 'vitest';
import type { TranscodeDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import { orderDevices } from './orderDevices';

const device = (id: string): TranscodeDevice => ({
  id,
  name: id,
  vendor: 'other',
  accels: [],
  probed: false,
  encoders: [],
  capacity: 0,
  streams: 0,
  busyPercent: null,
});

describe('orderDevices', () => {
  it('keeps the order an administrator chose', () => {
    expect(
      orderDevices(
        [device('a'), device('b')],
        [
          { id: 'b', isOn: true, maxStreams: 3 },
          { id: 'a', isOn: false, maxStreams: null },
        ],
      ).map(({ id, isOn, maxStreams, position }) => ({ id, isOn, maxStreams, position })),
    ).toEqual([
      { id: 'b', isOn: true, maxStreams: 3, position: 0 },
      { id: 'a', isOn: false, maxStreams: null, position: 1 },
    ]);
  });

  it('puts a device nobody has chosen yet last, switched on and uncapped', () => {
    expect(
      orderDevices([device('new'), device('a')], [{ id: 'a', isOn: true, maxStreams: 2 }]).map(
        ({ id, isOn, maxStreams }) => ({ id, isOn, maxStreams }),
      ),
    ).toEqual([
      { id: 'a', isOn: true, maxStreams: 2 },
      { id: 'new', isOn: true, maxStreams: null },
    ]);
  });

  it('leaves out a device that was chosen but is no longer there', () => {
    expect(
      orderDevices([device('a')], [{ id: 'gone', isOn: true, maxStreams: null }]).map(
        (one) => one.id,
      ),
    ).toEqual(['a']);
  });
});
