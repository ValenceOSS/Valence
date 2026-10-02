import { describe, expect, it } from 'vitest';
import { REQUEST_ITEM_STATES } from '@ValenceContracts/schemas/MediaRequest';
import { calendarStateOfItem } from './calendarStateOfItem';

describe('calendarStateOfItem', () => {
  it('calls something not yet released not out yet, and something released but not found wanted', () => {
    expect(calendarStateOfItem('waiting')).toBe('notOutYet');
    expect(calendarStateOfItem('wanted')).toBe('wanted');
    expect(calendarStateOfItem('failed')).toBe('wanted');
  });

  it('calls everything between finding a release and filing it downloading', () => {
    for (const state of ['searching', 'chosen', 'downloading', 'filing', 'filed'] as const) {
      expect(calendarStateOfItem(state)).toBe('downloading');
    }
  });

  it('has a word for every state a request can be in', () => {
    for (const state of REQUEST_ITEM_STATES) {
      expect(calendarStateOfItem(state)).toEqual(expect.any(String));
    }
  });
});
