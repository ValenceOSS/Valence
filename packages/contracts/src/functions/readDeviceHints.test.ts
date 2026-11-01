import { describe, expect, it } from 'vitest';
import { readDeviceHints } from './readDeviceHints';
import { writeDeviceHints } from './writeDeviceHints';

describe('readDeviceHints', () => {
  it('reads back what a client wrote, a name with a curly apostrophe included', () => {
    const hints = {
      id: 'b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
      app: 'phone',
      system: 'ios',
      model: 'iPhone 17 Pro Max',
      name: 'Dan’s iPhone',
    } as const;

    expect(readDeviceHints(writeDeviceHints(hints))).toEqual(hints);
  });

  it('says nothing for a client that sent nothing', () => {
    expect(readDeviceHints(null)).toEqual({});
    expect(readDeviceHints(undefined)).toEqual({});
  });

  it('says nothing for a header that is not what a client writes', () => {
    expect(readDeviceHints('%E0%A4%A')).toEqual({});
    expect(readDeviceHints('not json')).toEqual({});
    expect(readDeviceHints(encodeURIComponent('[1,2]'))).toEqual({});
  });

  it('keeps what it understands from a newer client and drops the rest', () => {
    const fromANewerClient = encodeURIComponent(
      JSON.stringify({ system: 'macos', app: 'watch', model: 'x'.repeat(200) }),
    );

    expect(readDeviceHints(fromANewerClient)).toEqual({ system: 'macos' });
  });

  it('refuses a header too long to be one a client wrote', () => {
    expect(readDeviceHints(writeDeviceHints({ name: 'a' }).padEnd(3000, 'a'))).toEqual({});
  });

  it('refuses a device id that could be anything but an id', () => {
    expect(readDeviceHints(writeDeviceHints({ id: 'short' }))).toEqual({});
    expect(readDeviceHints(writeDeviceHints({ id: '../../etc/passwd' }))).toEqual({});
  });
});
