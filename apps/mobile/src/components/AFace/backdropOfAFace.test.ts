import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { backdropOfAFace } from './backdropOfAFace';

describe('backdropOfAFace', () => {
  it('draws the profile’s colour behind an initial', () => {
    expect(backdropOfAFace('#33aa55', false, '#e9f3ef')).toBe('#33aa55');
  });

  it('draws a faint wash of the text colour behind a picture, as the web does', () => {
    expect(backdropOfAFace('#33aa55', true, '#e9f3ef')).toBe(withAlpha('#e9f3ef', 0.06));
  });
});
