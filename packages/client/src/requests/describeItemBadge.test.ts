import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { describe, expect, it } from 'vitest';
import { describeItemBadge } from './describeItemBadge';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const item = (overrides: Partial<RequestItem> = {}): RequestItem => ({
  id: '6ba7b810-9dad-11d1-80b4-000000000001',
  musicBrainzId: null,
  season: 1,
  episode: 1,
  title: 'Pilot',
  airDate: '2026-09-01',
  state: 'waiting',
  problem: null,
  problemCode: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  downloadedBytes: null,
  downloadSeconds: null,
  isFollowed: true,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

const TODAY = '2026-09-20';

describe('describeItemBadge', () => {
  it('says an episode that has not aired is not out yet, and when it will be', () => {
    expect(describeItemBadge(item({ airDate: '2026-10-02' }), TODAY)).toMatchObject({
      label: 'Not out yet',
      detail: 'Out 2 Oct 2026.',
    });
  });

  it('says an episode that has aired is queued to search', () => {
    expect(describeItemBadge(item(), TODAY).label).toBe('Queued to search');
  });

  it('names the release being fetched, and says what went wrong where something did', () => {
    expect(
      describeItemBadge(item({ state: 'downloading', releaseTitle: 'Show.S01E01.1080p' }), TODAY),
    ).toMatchObject({ label: 'Downloading', detail: 'Show.S01E01.1080p' });
    expect(
      describeItemBadge(
        item({ state: 'failed', problem: sayVerbatim('No release was good enough') }),
        TODAY,
      ),
    ).toMatchObject({ label: 'Failed', tone: 'danger', detail: 'No release was good enough' });
  });

  it('says an episode in the library is available', () => {
    expect(describeItemBadge(item({ state: 'available' }), TODAY)).toMatchObject({
      label: 'In the library',
      tone: 'success',
    });
  });
});
