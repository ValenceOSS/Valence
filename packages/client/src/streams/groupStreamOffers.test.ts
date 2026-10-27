import { describe, expect, it } from 'vitest';
import { aStreamOffer } from '@ValenceClient/testing/aStreamOffer';
import { groupStreamOffers } from './groupStreamOffers';

const UHD = aStreamOffer({ id: 'uhd', resolution: '2160p' });
const HD = aStreamOffer({ id: 'hd' });
const SD = aStreamOffer({ id: 'sd', resolution: '480p' });
const CAM = aStreamOffer({ id: 'cam', resolution: '1080p', source: 'cam' });
const LATER = aStreamOffer({ id: 'later', isReady: false });

describe('groupStreamOffers', () => {
  it('puts each stream under its resolution, the rest together and cinema copies last', () => {
    const { groups } = groupStreamOffers([CAM, SD, HD, UHD], false);

    expect(groups.map((group) => [group.id, group.offers.map((offer) => offer.id)])).toEqual([
      ['2160p', ['uhd']],
      ['1080p', ['hd']],
      ['other', ['sd']],
      ['lower', ['cam']],
    ]);
    expect(groups.map((group) => group.heading)).toEqual([
      '4K',
      '1080p',
      'Other qualities',
      'Lower quality',
    ]);
  });

  it('leaves out what downloads first while anything starts straight away, and counts it', () => {
    expect(groupStreamOffers([HD, LATER], false)).toMatchObject({
      groups: [{ id: '1080p', offers: [HD] }],
      isAnyReady: true,
      laterCount: 1,
    });
    expect(groupStreamOffers([HD, LATER], true).groups[0]?.offers).toEqual([HD, LATER]);
  });

  it('lists everything where nothing starts straight away', () => {
    expect(groupStreamOffers([LATER], false)).toMatchObject({
      groups: [{ offers: [LATER] }],
      isAnyReady: false,
      laterCount: 0,
    });
  });

  it('holds no groups where nothing is offered', () => {
    expect(groupStreamOffers([], false).groups).toEqual([]);
  });
});
