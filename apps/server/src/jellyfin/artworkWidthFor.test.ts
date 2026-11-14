import { describe, expect, it } from 'vitest';
import { artworkWidthFor } from './artworkWidthFor';

describe('artworkWidthFor', () => {
  it('sends the small copy for a grid', () => {
    expect(artworkWidthFor('primary', { maxwidth: '300' })).toBe(342);
  });

  it('sends the medium copy for a wider card', () => {
    expect(artworkWidthFor('primary', { fillwidth: '600' })).toBe(640);
  });

  it('sends the whole picture where neither copy is wide enough', () => {
    expect(artworkWidthFor('backdrop', { maxwidth: '1920' })).toBeNull();
  });

  it('works out the width from a height by the picture’s shape', () => {
    expect(artworkWidthFor('primary', { maxheight: '450' })).toBe(342);
    expect(artworkWidthFor('backdrop', { maxheight: '450' })).toBeNull();
  });

  it('sends the medium copy where no size was asked for', () => {
    expect(artworkWidthFor('primary', {})).toBe(640);
  });
});
