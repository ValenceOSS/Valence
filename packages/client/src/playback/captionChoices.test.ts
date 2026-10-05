import { describe, expect, it } from 'vitest';
import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import { captionChoices } from './captionChoices';

/**
 * The set of choices for one part of the style.
 *
 * @param id - Which part.
 * @returns The set.
 */
const theSet = (id: string) => {
  const found = captionChoices(DEFAULT_CAPTION_STYLE).find((set) => set.id === id);

  if (found === undefined) {
    throw new Error(`No ${id} choices.`);
  }

  return found;
};

describe('captionChoices', () => {
  it('offers size, font, weight, colour, background, how solid it is and edge, in that order', () => {
    expect(captionChoices(DEFAULT_CAPTION_STYLE).map((set) => set.heading)).toEqual([
      'Size',
      'Font',
      'Weight',
      'Text colour',
      'Background',
      'Background opacity',
      'Edge',
    ]);
  });

  it('says what is chosen now', () => {
    expect(theSet('size').chosen).toBe('100');
    expect(theSet('edge').chosen).toBe('outline');
    expect(theSet('backgroundOpacity').chosen).toBe('0.75');
  });

  it('names sizes and how solid a background is as percentages', () => {
    expect(theSet('size').choices.map((choice) => choice.label)).toEqual([
      '50%',
      '75%',
      '100%',
      '125%',
      '150%',
      '200%',
      '250%',
      '300%',
      '400%',
      '500%',
    ]);
    expect(theSet('backgroundOpacity').choices.at(-1)?.label).toBe('100%');
  });

  it('offers a size chosen elsewhere among the steps, so it reads as chosen here too', () => {
    const sizes = captionChoices({ ...DEFAULT_CAPTION_STYLE, fontScale: 135 }).find(
      (set) => set.id === 'size',
    );

    expect(sizes?.chosen).toBe('135');
    expect(sizes?.choices.map((choice) => choice.id)).toContain('135');
  });

  it('offers eight fonts and five weights, medium unless chosen otherwise', () => {
    expect(theSet('font').choices.map((choice) => choice.label)).toEqual([
      'Sans',
      'Serif',
      'Mono',
      'Typewriter',
      'Casual',
      'Script',
      'Small capitals',
      'Condensed',
    ]);
    expect(theSet('weight').choices.map((choice) => choice.label)).toEqual([
      'Light',
      'Regular',
      'Medium',
      'Bold',
      'Heavy',
    ]);
    expect(theSet('weight').chosen).toBe('medium');
    expect(theSet('weight').choose('heavy')).toEqual({
      ...DEFAULT_CAPTION_STYLE,
      fontWeight: 'heavy',
    });
  });

  it('changes only the part chosen, keeping the rest of the style', () => {
    expect(theSet('size').choose('150')).toEqual({ ...DEFAULT_CAPTION_STYLE, fontScale: 150 });
    expect(theSet('colour').choose('#ffff00')).toEqual({
      ...DEFAULT_CAPTION_STYLE,
      color: '#ffff00',
    });
    expect(theSet('font').choose('serif').fontFamily).toBe('serif');
    expect(theSet('edge').choose('shadow').edgeStyle).toBe('shadow');
  });

  it('keeps a font or an edge it does not know as it was', () => {
    expect(theSet('font').choose('comic').fontFamily).toBe('sans');
    expect(theSet('edge').choose('glow').edgeStyle).toBe('outline');
  });
});
