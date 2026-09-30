import { theColours } from '@ValenceMobile/theme/theColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import { theVeilFor } from './theVeilFor';

describe('theVeilFor', () => {
  it('dims the lights in the dark', () => {
    expect(theVeilFor(theColours.dark)).toBe('rgba(0, 0, 0, 0.28)');
  });

  it('pales them with the page in the light, rather than greying it', () => {
    expect(theVeilFor(theColours.light)).toBe(withAlpha(theColours.light.surface, 0.6));
  });
});
