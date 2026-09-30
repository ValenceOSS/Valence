import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  toCueCss,
  withOpacity,
  readCaptionStyle,
  saveCaptionStyle,
  DEFAULT_CAPTION_STYLE,
} from './captionStyle';

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('withOpacity', () => {
  it('turns a hex colour into one CSS can fade', () => {
    expect(withOpacity('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('understands the short form', () => {
    expect(withOpacity('#f00', 1)).toBe('rgba(255, 0, 0, 1)');
  });

  it('leaves a colour it cannot read alone rather than drawing it wrong', () => {
    expect(withOpacity('rebeccapurple', 0.5)).toBe('rebeccapurple');
  });
});

describe('edgeStyle', () => {
  it('fades the edge with the lettering, so turning the text down turns it down', () => {
    const solid = toCueCss({ ...DEFAULT_CAPTION_STYLE, opacity: 1 });
    const faint = toCueCss({ ...DEFAULT_CAPTION_STYLE, opacity: 0.4 });

    expect(solid).toContain('rgba(0, 0, 0, 1.00)');
    expect(faint).toContain('rgba(0, 0, 0, 0.40)');
  });

  it('draws no edge where none was asked for', () => {
    expect(toCueCss({ ...DEFAULT_CAPTION_STYLE, edgeStyle: 'none' })).toContain(
      'text-shadow: none',
    );
  });
});

describe('toCueCss', () => {
  it('sets the appearance of the text a browser draws', () => {
    const css = toCueCss(DEFAULT_CAPTION_STYLE);

    expect(css).toContain('font-family:');
    expect(css).toContain('font-size: 100%;');
    expect(css).toContain('color: rgba(255, 255, 255, 1);');
  });

  it('carries background opacity separately from background colour', () => {
    const css = toCueCss({ ...DEFAULT_CAPTION_STYLE, backgroundOpacity: 0 });

    expect(css).toContain('background-color: rgba(0, 0, 0, 0);');
  });

  it('draws an outline by default, which reads on a busy scene', () => {
    const css = toCueCss(DEFAULT_CAPTION_STYLE);

    expect(DEFAULT_CAPTION_STYLE.edgeStyle).toBe('outline');
    expect(css).toContain('text-shadow: ');
    expect(css).toContain('em 0 rgba(0, 0, 0, 1.00)');
  });

  it('draws an outline all the way round, so a thick one stays solid', () => {
    const shadow = /text-shadow: ([^;]+);/.exec(toCueCss(DEFAULT_CAPTION_STYLE))?.[1] ?? '';

    expect(shadow.split('), ')).toHaveLength(17);
  });

  it('draws a thicker outline further from the lettering, measured against it', () => {
    const reachOf = (thickness: number): number =>
      Number(
        /text-shadow: (-?[\d.]+)em/.exec(
          toCueCss({ ...DEFAULT_CAPTION_STYLE, outlineThickness: thickness }),
        )?.[1],
      );

    expect(reachOf(4)).toBeCloseTo(reachOf(1) * 4);
  });

  it('draws no edge when asked for none', () => {
    expect(toCueCss({ ...DEFAULT_CAPTION_STYLE, edgeStyle: 'none' })).toContain(
      'text-shadow: none;',
    );
  });

  it('scales the text rather than fixing its size', () => {
    expect(toCueCss({ ...DEFAULT_CAPTION_STYLE, fontScale: 200 })).toContain('font-size: 200%;');
  });
});

describe('readCaptionStyle', () => {
  it('answers with the defaults when nothing has been chosen', () => {
    expect(readCaptionStyle()).toEqual(DEFAULT_CAPTION_STYLE);
  });

  it('reads settings saved before outlines had a thickness as the thinnest outline', () => {
    window.localStorage.setItem(
      'valence.captionStyle',
      JSON.stringify({ fontScale: 120, edgeStyle: 'outline' }),
    );

    expect(readCaptionStyle()).toMatchObject({ fontScale: 120, outlineThickness: 1 });
  });

  it('reads back what was saved', () => {
    saveCaptionStyle({ ...DEFAULT_CAPTION_STYLE, fontScale: 150, edgeStyle: 'shadow' });

    expect(readCaptionStyle()).toMatchObject({ fontScale: 150, edgeStyle: 'shadow' });
  });

  it('falls back to the defaults rather than throwing on a stale setting', () => {
    window.localStorage.setItem('valence.captionStyle', '{"fontScale":"enormous"}');

    expect(readCaptionStyle()).toEqual(DEFAULT_CAPTION_STYLE);
  });

  it('falls back to the defaults when the stored value is not even JSON', () => {
    window.localStorage.setItem('valence.captionStyle', 'not json');

    expect(readCaptionStyle()).toEqual(DEFAULT_CAPTION_STYLE);
  });

  it('refuses a size outside what is readable', () => {
    window.localStorage.setItem('valence.captionStyle', '{"fontScale":5000}');

    expect(readCaptionStyle()).toEqual(DEFAULT_CAPTION_STYLE);
  });
});

describe('saveCaptionStyle', () => {
  it('does not fail when a browser refuses to store anything', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('Storage is full.');
      },
    });

    expect(() => {
      saveCaptionStyle(DEFAULT_CAPTION_STYLE);
    }).not.toThrow();
  });
});
