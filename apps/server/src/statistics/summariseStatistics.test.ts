import { describe, expect, it } from 'vitest';
import { summariseStatistics } from './summariseStatistics';
import type { ViewingRow } from './StatisticsInputs';

const NOW = new Date('2026-10-17T12:00:00Z');

const aViewing = (overrides: Partial<ViewingRow> = {}): ViewingRow => ({
  mediaItemId: 'film',
  title: 'Arrival',
  seriesId: null,
  seriesTitle: null,
  profileId: 'priya',
  profileName: 'Priya',
  startedAt: new Date('2026-10-16T20:15:00Z'),
  secondsWatched: 3600,
  ...overrides,
});

describe('summariseStatistics', () => {
  it('fills every day of the range, with what was watched on each', () => {
    const summary = summariseStatistics({
      range: 'week',
      zone: 'UTC',
      now: NOW,
      viewings: [aViewing(), aViewing({ secondsWatched: 1800 })],
      plays: [],
      added: [],
    });

    expect(summary.days).toHaveLength(7);
    expect(summary.days.at(-2)).toEqual({ day: '2026-10-16', plays: 2, hours: 1.5 });
    expect(summary.totals).toEqual({ plays: 2, hours: 1.5, viewers: 1, titles: 1 });
  });

  it('counts the busy hours on the viewer’s own clock, from Monday', () => {
    const summary = summariseStatistics({
      range: 'week',
      zone: 'Europe/London',
      now: NOW,
      viewings: [aViewing()],
      plays: [],
      added: [],
    });

    expect(summary.busyHours[4]?.[21]).toBe(1);
    expect(summary.busyDetail).toEqual([
      { weekday: 4, hour: 21, viewers: ['Priya'], titles: ['Arrival'] },
    ]);
  });

  it('puts the episodes of a series together as one title', () => {
    const summary = summariseStatistics({
      range: 'week',
      zone: 'UTC',
      now: NOW,
      viewings: [
        aViewing({ mediaItemId: 'e1', title: 'Pilot', seriesId: 's', seriesTitle: 'Severance' }),
        aViewing({ mediaItemId: 'e2', title: 'Two', seriesId: 's', seriesTitle: 'Severance' }),
        aViewing({ profileId: 'leo', profileName: 'Leo' }),
      ],
      plays: [],
      added: [],
    });

    expect(summary.topTitles[0]).toMatchObject({ title: 'Severance', plays: 2, seriesId: 's' });
    expect(summary.topViewers.map((viewer) => viewer.name)).toEqual(['Priya', 'Leo']);
  });

  it('counts how plays were delivered, why they were converted and on what', () => {
    const summary = summariseStatistics({
      range: 'week',
      zone: 'UTC',
      now: NOW,
      viewings: [],
      plays: [
        { at: NOW, mode: 'DirectPlay', reasons: [], client: 'Living room TV' },
        {
          at: NOW,
          mode: 'Transcode',
          reasons: ['AudioCodecNotSupported', 'VideoCodecNotSupported', 'ClientSupportsSource'],
          client: 'Phone',
        },
        { at: NOW, mode: 'Transcode', reasons: ['AudioCodecNotSupported'], client: 'Phone' },
      ],
      added: [],
    });

    expect(summary.modes).toEqual({ DirectPlay: 1, Remux: 0, DirectStream: 0, Transcode: 2 });
    expect(summary.reasons).toEqual([
      { code: 'AudioCodecNotSupported', plays: 2 },
      { code: 'VideoCodecNotSupported', plays: 1 },
    ]);
    expect(summary.clients[0]).toMatchObject({ client: 'Phone', plays: 2 });
  });

  it('counts what arrived by the week it arrived in', () => {
    const summary = summariseStatistics({
      range: 'month',
      zone: 'UTC',
      now: NOW,
      viewings: [],
      plays: [],
      added: [
        new Date('2026-10-14T10:00:00Z'),
        new Date('2026-10-12T10:00:00Z'),
        new Date('2026-10-05T10:00:00Z'),
      ],
    });

    expect(summary.added).toContainEqual({ week: '2026-10-05', items: 1 });
    expect(summary.added).toContainEqual({ week: '2026-10-12', items: 2 });
    expect(summary.added.at(0)).toEqual({ week: '2026-09-14', items: 0 });
  });
});
