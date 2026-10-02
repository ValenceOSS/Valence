import { describe, expect, it } from 'vitest';
import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import { toCueCss } from './captionStyle';

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
