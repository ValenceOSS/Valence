import { guideRules } from '@ValenceTv/focus/guideRules';
import { landingPlacesIn } from '@ValenceTv/focus/landingPlacesIn';
import { aLandingPlace } from '@ValenceTv/testing/aLandingPlace';

const box = { left: 0, top: 0, right: 100, bottom: 100 };

describe('landingPlacesIn', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('finds what is focusable and drawn', () => {
    aLandingPlace(document.body, 'drawn', box);
    aLandingPlace(document.body, 'hidden', { left: 0, top: 0, right: 0, bottom: 0 });

    const unreachable = aLandingPlace(document.body, 'unreachable', box);

    unreachable.tabIndex = -1;

    expect(landingPlacesIn(document.body).map((place) => place.getAttribute('aria-label'))).toEqual(
      ['drawn'],
    );
  });

  it('leaves out what is behind a shut fence', () => {
    const fence = document.createElement('div');

    document.body.append(fence);
    guideRules.set(fence, {
      isRemembering: false,
      trapped: new Set(),
      isShut: true,
      lastFocused: null,
    });
    aLandingPlace(fence, 'fenced', box);

    expect(landingPlacesIn(document.body)).toEqual([]);
  });
});
