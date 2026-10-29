import { describe, expect, it } from 'vitest';
import { shortDeviceName } from './shortDeviceName';

describe('shortDeviceName', () => {
  it('leaves out the maker a card is named after', () => {
    expect(shortDeviceName('NVIDIA GeForce RTX 5080')).toBe('RTX 5080');
    expect(shortDeviceName('Intel(R) Arc(TM) A380 Graphics')).toBe('Arc(TM) A380 Graphics');
    expect(shortDeviceName('AMD Radeon RX 7900 XTX')).toBe('Radeon RX 7900 XTX');
  });

  it('keeps a name that does not start with its maker', () => {
    expect(shortDeviceName('Radeon Pro W7900')).toBe('Radeon Pro W7900');
  });

  it('keeps a name that is nothing but its maker', () => {
    expect(shortDeviceName('NVIDIA')).toBe('NVIDIA');
  });
});
