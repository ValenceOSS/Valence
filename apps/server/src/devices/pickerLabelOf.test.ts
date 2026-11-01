import { describe, expect, it } from 'vitest';
import { pickerLabelOf } from './pickerLabelOf';

describe('pickerLabelOf', () => {
  it('names a browser by the browser it is, since two on one Mac are both a Mac', () => {
    expect(
      pickerLabelOf({
        deviceLabel: 'Mac',
        clientLabel: 'Safari on macOS',
        clientKind: 'browser',
        renamed: null,
      }),
    ).toBe('Safari on macOS');
  });

  it('names a browser by the name its owner gave its device', () => {
    expect(
      pickerLabelOf({
        deviceLabel: 'Study Mac',
        clientLabel: 'Safari on macOS',
        clientKind: 'browser',
        renamed: 'Study Mac',
      }),
    ).toBe('Study Mac');
  });

  it('names an app by the device it runs on', () => {
    expect(
      pickerLabelOf({
        deviceLabel: 'Living Room',
        clientLabel: 'Valence for Apple TV',
        clientKind: 'tv',
        renamed: null,
      }),
    ).toBe('Living Room');
  });

  it('names a connection that never said what it reaches Valence through by its device', () => {
    expect(
      pickerLabelOf({
        deviceLabel: 'Kitchen',
        clientLabel: null,
        clientKind: 'browser',
        renamed: null,
      }),
    ).toBe('Kitchen');
  });
});
