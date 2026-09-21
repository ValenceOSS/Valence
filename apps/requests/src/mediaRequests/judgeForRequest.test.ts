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
      blocked: [{ title: BLURAY, reason: 'The tracker is gone' }],
    });

    expect(judged.pickedId).toBeNull();
    expect(judged.judgements[0]?.rejections).toEqual(['It failed before: The tracker is gone']);
  });

  it('refuses what would fetch nothing, and what is no better than what is here', () => {
    expect(
      judgeForRequest({
        ...OPTIONS,
        releases: [aRelease(BLURAY)],
        items: [aRequestItem({ state: 'downloading' })],
      }).judgements[0]?.rejections,
    ).toEqual(['Everything it holds is here or on its way already']);

    expect(
      judgeForRequest({
        ...OPTIONS,
        releases: [aRelease(WEB)],
        items: [aRequestItem({ state: 'available', score: 5000 })],
        isFetching: () => true,
      }).judgements[0]?.rejections,
    ).toEqual(['It is no better than what is here already']);
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
