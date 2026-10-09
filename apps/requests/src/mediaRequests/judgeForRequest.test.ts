import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { aRelease } from '@ValenceRequests/testing/aRelease';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { judgeForRequest } from './judgeForRequest';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

const WEB = 'Dune.2021.1080p.WEB-DL.x264-GRP';

const BLURAY = 'Dune.2021.1080p.BluRay.x264-GRP';

const OPTIONS = {
  request: aMediaRequest(),
  items: [aRequestItem()],
  profile: aProfile({ sources: ['bluray', 'webdl'] }),
  blocked: [],
  priorities: new Map<string, number>(),
  isFetching: (item: RequestItemRecord) => item.state === 'wanted',
};

describe('judgeForRequest', () => {
  it('keeps only releases for the request, best first, and picks the best', () => {
    const judged = judgeForRequest({
      ...OPTIONS,
      releases: [aRelease(WEB), aRelease(BLURAY), aRelease('Heat.1995.1080p.BluRay.x264-GRP')],
    });

    expect(judged.releases.map((release) => release.title)).toEqual([BLURAY, WEB]);
    expect(judged.pickedId).toBe(BLURAY);
    expect(judged.holding.get(BLURAY)?.map((item) => item.id)).toEqual([aRequestItem().id]);
  });

  it('takes the library’s language where the profile names none', () => {
    const GERMAN = 'Dune.2021.1080p.GERMAN.BluRay.x264-GRP';
    const judged = judgeForRequest({
      ...OPTIONS,
      request: aMediaRequest({ libraryLanguage: 'de' }),
      releases: [aRelease(BLURAY), aRelease(GERMAN)],
    });

    expect(judged.pickedId).toBe(GERMAN);
  });

  it('lets the profile’s own language override the library’s', () => {
    const GERMAN = 'Dune.2021.1080p.GERMAN.BluRay.x264-GRP';
    const judged = judgeForRequest({
      ...OPTIONS,
      request: aMediaRequest({ libraryLanguage: 'de' }),
      profile: aProfile({ sources: ['bluray', 'webdl'], preferredLanguage: 'en' }),
      releases: [aRelease(BLURAY), aRelease(GERMAN)],
    });

    expect(judged.pickedId).toBe(BLURAY);
  });

  it('refuses a release that failed before', () => {
    const judged = judgeForRequest({
      ...OPTIONS,
      releases: [aRelease(BLURAY)],
      blocked: [{ title: BLURAY, reason: sayVerbatim('The tracker is gone') }],
    });

    expect(judged.pickedId).toBeNull();
    expect(judged.judgements[0]?.rejections).toEqual(['It failed previously: The tracker is gone']);
  });

  it('refuses the same torrent posted under another name', () => {
    const HASH = 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a';
    const judged = judgeForRequest({
      ...OPTIONS,
      releases: [aRelease(BLURAY, { infoHash: HASH })],
      blocked: [
        { title: 'Dune.2021.Something.Else', infoHash: HASH, reason: sayVerbatim('Stalled') },
      ],
    });

    expect(judged.pickedId).toBeNull();
    expect(judged.judgements[0]?.rejections).toEqual(['It failed previously: Stalled']);
  });

  it('keeps a release whose name is not for the request, refused, for somebody choosing', () => {
    const judged = judgeForRequest({
      ...OPTIONS,
      releases: [aRelease(BLURAY), aRelease('Heat.1995.1080p.BluRay.x264-GRP')],
      keepsTheUnnamed: true,
    });

    expect(judged.releases.map((release) => release.title)).toEqual([
      BLURAY,
      'Heat.1995.1080p.BluRay.x264-GRP',
    ]);
    expect(judged.judgements[1]).toMatchObject({
      isRejected: true,
      rejections: ['Its name doesn’t match this title'],
    });
    expect(judged.pickedId).toBe(BLURAY);
  });

  it('refuses what would fetch nothing, and what is no better than what is here', () => {
    expect(
      judgeForRequest({
        ...OPTIONS,
        releases: [aRelease(BLURAY)],
        items: [aRequestItem({ state: 'downloading' })],
      }).judgements[0]?.rejections,
    ).toEqual(['Everything in it is already in the library or downloading']);

    expect(
      judgeForRequest({
        ...OPTIONS,
        releases: [aRelease(WEB)],
        items: [aRequestItem({ state: 'available', score: 5000 })],
        isFetching: () => true,
      }).judgements[0]?.rejections,
    ).toEqual(['It’s no better than what’s already in the library']);
  });

  it('refuses a whole run where most of what it holds is here already', () => {
    const PACK = 'Severance.S01-S03.1080p.BluRay.x264-GRP';
    const series = aMediaRequest({ kind: 'series', title: 'Severance', year: 2022 });
    const episodes = (state: RequestItemRecord['state'], season: number, count: number) =>
      Array.from({ length: count }, (_unused, index) =>
        aRequestItem({
          id: `${season.toString()}x${(index + 1).toString()}`,
          season,
          episode: index + 1,
          title: 'Severance',
          state,
        }),
      );

    expect(
      judgeForRequest({
        ...OPTIONS,
        request: series,
        releases: [aRelease(PACK)],
        items: [
          ...episodes('available', 1, 9),
          ...episodes('available', 2, 9),
          ...episodes('wanted', 3, 2),
        ],
      }).judgements[0]?.rejections,
    ).toEqual(['Only 2 of its 20 episodes are wanted']);

    expect(
      judgeForRequest({
        ...OPTIONS,
        request: series,
        releases: [aRelease('Severance.S01-S02.1080p.BluRay.x264-GRP')],
        items: [...episodes('available', 1, 3), ...episodes('wanted', 2, 9)],
      }).judgements[0]?.isRejected,
    ).toBe(false);
  });

  it('counts the seasons a pack holds that nobody asked for', () => {
    const series = aMediaRequest({
      kind: 'series',
      title: 'Severance',
      year: 2022,
      followsAfter: 9,
    });
    const asked = Array.from({ length: 9 }, (_unused, index) =>
      aRequestItem({
        id: `3x${(index + 1).toString()}`,
        season: 3,
        episode: index + 1,
        title: 'Severance',
        state: 'wanted',
      }),
    );
    const judgedFor = (title: string) =>
      judgeForRequest({ ...OPTIONS, request: series, releases: [aRelease(title)], items: asked })
        .judgements[0]?.rejections;

    expect(judgedFor('Severance.S01-S09.1080p.BluRay.x264-GRP')).toEqual([
      'Only 1 of the 9 seasons it holds are wanted',
    ]);
    expect(judgedFor('Severance.Complete.Series.1080p.BluRay.x264-GRP')).toEqual([
      'Only 1 of the 9 seasons it holds are wanted',
    ]);
  });

  it('takes a release an indexer found by id under a title near the one asked for', () => {
    const office = aMediaRequest({ kind: 'series', title: 'The Office', year: 2005 });
    const items = [aRequestItem({ season: 2, episode: 1, title: 'The Office' })];
    const judged = (title: string, isFoundById: boolean) =>
      judgeForRequest({
        ...OPTIONS,
        request: office,
        items,
        releases: [aRelease(title, { isFoundById })],
      }).releases.length;

    expect(judged('The.Office.US.S02E01.1080p.WEB-DL.x264-GRP', true)).toBe(1);
    expect(judged('The.Office.US.S02E01.1080p.WEB-DL.x264-GRP', false)).toBe(0);
    expect(judged('Officer.Down.S02E01.1080p.WEB-DL.x264-GRP', true)).toBe(0);
  });

  it('refuses a release no download client is on for', () => {
    expect(
      judgeForRequest({
        ...OPTIONS,
        releases: [aRelease(WEB, { protocol: 'usenet' })],
        takes: new Set(['torrent'] as const),
      }).judgements[0]?.rejections,
    ).toEqual(['No usenet client is set up and turned on']);
  });

  it('never grudges a single season pack what it holds', () => {
    const series = aMediaRequest({ kind: 'series', title: 'Severance', year: 2022 });

    expect(
      judgeForRequest({
        ...OPTIONS,
        request: series,
        releases: [aRelease('Severance.S01.1080p.BluRay.x264-GRP')],
        items: [
          aRequestItem({ id: '1x1', season: 1, episode: 1, title: 'Severance', state: 'wanted' }),
          aRequestItem({
            id: '1x2',
            season: 1,
            episode: 2,
            title: 'Severance',
            state: 'available',
          }),
          aRequestItem({
            id: '1x3',
            season: 1,
            episode: 3,
            title: 'Severance',
            state: 'available',
          }),
        ],
      }).judgements[0]?.isRejected,
    ).toBe(false);
  });

  it('takes a release picked by hand by its numbers, whatever it is called', () => {
    const judged = judgeForRequest({
      ...OPTIONS,
      releases: [aRelease('Dune.Part.One.2021.1080p.BluRay.x264-GRP')],
      isTitleChecked: false,
    });

    expect(judged.pickedId).toBe('Dune.Part.One.2021.1080p.BluRay.x264-GRP');
  });
});
