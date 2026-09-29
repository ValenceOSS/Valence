import { describe, expect, it } from 'vitest';
import { ContributionsSchema } from './ContributionsSchema';

describe('ContributionsSchema', () => {
  it('defaults every list to empty', () => {
    expect(ContributionsSchema.parse({})).toEqual({
      pages: [],
      panels: [],
      themes: [],
      schedules: [],
      events: [],
      webhooks: [],
      nodes: [],
    });
  });

  it('refuses an event topic Valence does not publish', () => {
    expect(ContributionsSchema.safeParse({ events: ['auth.failed'] }).success).toBe(false);
    expect(ContributionsSchema.safeParse({ events: ['playback.finished'] }).success).toBe(true);
  });

  it('refuses a panel on something Valence has no page for', () => {
    expect(
      ContributionsSchema.safeParse({ panels: [{ id: 'x', title: 'X', on: 'settings' }] }).success,
    ).toBe(false);
  });
});
