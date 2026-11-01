import { describe, expect, it } from 'vitest';
import { deviceInASentence } from './deviceInASentence';

describe('deviceInASentence', () => {
  it('names the device and what it reached Valence through', () => {
    expect(
      deviceInASentence({ deviceLabel: 'iPhone 17 Pro Max', clientLabel: 'Valence for iOS' }),
    ).toBe('iPhone 17 Pro Max (Valence for iOS)');
  });

  it('names the device alone where nothing said what it reached Valence through', () => {
    expect(deviceInASentence({ deviceLabel: 'Chrome on macOS', clientLabel: null })).toBe(
      'Chrome on macOS',
    );
  });
});
