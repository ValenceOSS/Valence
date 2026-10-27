import { describe, expect, it } from 'vitest';
import { smartEntryId } from './smartEntryId';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

describe('smartEntryId', () => {
  it('is shaped as an entry put in by hand is, and the same every time', () => {
    const id = smartEntryId('list', 'film:one');

    expect(id).toMatch(UUID);
    expect(smartEntryId('list', 'film:one')).toBe(id);
  });

  it('differs for something else, or the same thing in another list', () => {
    expect(smartEntryId('list', 'film:two')).not.toBe(smartEntryId('list', 'film:one'));
    expect(smartEntryId('other', 'film:one')).not.toBe(smartEntryId('list', 'film:one'));
  });
});
