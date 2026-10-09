import { describe, expect, it } from 'vitest';
import { CALENDAR_STATES } from '@ValenceContracts/schemas/ReleaseCalendar';
import { describeCalendarState } from './describeCalendarState';

describe('describeCalendarState', () => {
  it('draws each state the way the rest of the app does', () => {
    expect(describeCalendarState('available')).toMatchObject({
      label: 'In the library',
      tone: 'success',
    });
    expect(describeCalendarState('downloading')).toMatchObject({
      label: 'Downloading',
      tone: 'busy',
    });
    expect(describeCalendarState('wanted')).toMatchObject({ label: 'Missing', tone: 'warning' });
    expect(describeCalendarState('notOutYet')).toMatchObject({
      label: 'Not out yet',
      tone: 'quiet',
    });
    expect(describeCalendarState('notHeld')).toMatchObject({
      label: 'Not in the library',
      tone: 'quiet',
    });
  });

  it('has a badge for every state', () => {
    for (const state of CALENDAR_STATES) {
      expect(describeCalendarState(state).label).not.toBe('');
    }
  });
});
