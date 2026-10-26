import { describe, expect, it } from 'vitest';
import { titleKey } from './titleKey';

describe('naming a title', () => {
  it('names a film and a programme sharing a catalogue identifier apart', () => {
    expect(titleKey('film', '1')).not.toBe(titleKey('series', '1'));
    expect(titleKey('film', '603')).toBe(titleKey('film', '603'));
  });
});
