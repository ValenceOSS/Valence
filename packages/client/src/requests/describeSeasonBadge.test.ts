import { describe, expect, it } from 'vitest';
import { describeSeasonBadge } from './describeSeasonBadge';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const episode = (state: RequestItem['state'], airDate = '2026-01-01'): RequestItem => ({
  id: '6ba7b810-9dad-11d1-80b4-000000000001',
  musicBrainzId: null,
  season: 1,
  episode: 1,
  title: 'Pilot',
  airDate,
  state,
  problem: null,
  problemCode: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  downloadedBytes: null,
  downloadSeconds: null,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
});

const TODAY = '2026-09-20';

describe('describeSeasonBadge', () => {
  it('says a season with every episode here is available', () => {
    expect(describeSeasonBadge([episode('available'), episode('available')], TODAY)).toMatchObject({
      label: 'Available',
      tone: 'success',
    });
  });

  it('says what is on its way, and counts what is here', () => {
    expect(
      describeSeasonBadge([episode('available'), episode('downloading'), episode('wanted')], TODAY),
    ).toMatchObject({ label: 'Downloading', detail: '1 of 3 available' });
  });

  it('says a season is wanted where an episode could not be found', () => {
    expect(describeSeasonBadge([episode('available'), episode('failed')], TODAY).label).toBe(
      'Wanted',
    );
  });

  it('tells a season that has not aired from one waiting to be searched for', () => {
    expect(describeSeasonBadge([episode('waiting', '2027-01-01')], TODAY).label).toBe(
      'Not out yet',
    );
    expect(describeSeasonBadge([episode('waiting')], TODAY).label).toBe('Queued to search');
  });
});
