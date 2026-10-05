import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import { captionTextStyle } from './captionTextStyle';

describe('captionTextStyle', () => {
  it('draws the defaults as white lettering on a dark box with an outline', () => {
    expect(captionTextStyle(DEFAULT_CAPTION_STYLE, 20)).toEqual({
      fontSize: 20,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 1)',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      textShadowColor: 'rgba(0, 0, 0, 0.9)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 1.5,
    });
  });

  it('draws the weight chosen, and small capitals as a variant of the plain face', () => {
    expect(captionTextStyle({ ...DEFAULT_CAPTION_STYLE, fontWeight: 'heavy' }, 20).fontWeight).toBe(
      '900',
    );
    expect(
      captionTextStyle({ ...DEFAULT_CAPTION_STYLE, fontFamily: 'smallCapitals' }, 20),
    ).toMatchObject({ fontVariant: ['small-caps'] });
    expect(captionTextStyle(DEFAULT_CAPTION_STYLE, 20).fontVariant).toBeUndefined();
  });

  it('scales the client’s own size rather than fixing one', () => {
    expect(captionTextStyle({ ...DEFAULT_CAPTION_STYLE, fontScale: 150 }, 20).fontSize).toBe(30);
  });

  it('asks for a family only where one was chosen', () => {
    expect(captionTextStyle(DEFAULT_CAPTION_STYLE, 20).fontFamily).toBeUndefined();
    expect(
      captionTextStyle({ ...DEFAULT_CAPTION_STYLE, fontFamily: 'mono' }, 20).fontFamily,
    ).toBeDefined();
  });

  it('draws a thicker outline further out, and no edge where none was asked for', () => {
    expect(
      captionTextStyle({ ...DEFAULT_CAPTION_STYLE, outlineThickness: 4 }, 20).textShadowRadius,
    ).toBe(6);
    expect(
      captionTextStyle({ ...DEFAULT_CAPTION_STYLE, edgeStyle: 'none' }, 20).textShadowColor,
    ).toBeUndefined();
  });

  it('drops a shadow or raises the lettering as asked', () => {
    expect(
      captionTextStyle({ ...DEFAULT_CAPTION_STYLE, edgeStyle: 'shadow' }, 20).textShadowOffset,
    ).toEqual({ width: 2, height: 2 });
    expect(
      captionTextStyle({ ...DEFAULT_CAPTION_STYLE, edgeStyle: 'raised' }, 20).textShadowRadius,
    ).toBe(0);
  });

  it('fades the box with its own opacity', () => {
    expect(
      captionTextStyle({ ...DEFAULT_CAPTION_STYLE, backgroundOpacity: 0 }, 20).backgroundColor,
    ).toBe('rgba(0, 0, 0, 0)');
  });
});
