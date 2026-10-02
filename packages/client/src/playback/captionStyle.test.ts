import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import {
  CAPTION_STYLE_KEY,
  DEFAULT_CAPTION_STYLE,
  readCaptionStyle,
  saveCaptionStyle,
  withOpacity,
} from './captionStyle';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('withOpacity', () => {
  it('turns a hex colour into one that can be faded', () => {
    expect(withOpacity('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('understands the short form', () => {
    expect(withOpacity('#f00', 1)).toBe('rgba(255, 0, 0, 1)');
  });

  it('leaves a colour it cannot read alone rather than drawing it wrong', () => {
    expect(withOpacity('rebeccapurple', 0.5)).toBe('rebeccapurple');
  });
});

describe('readCaptionStyle', () => {
  it('answers with the defaults when nothing has been chosen', () => {
    expect(readCaptionStyle()).toEqual(DEFAULT_CAPTION_STYLE);
  });

  it('reads settings saved before outlines had a thickness as the thinnest outline', () => {
    platformInUse().store.write(
      CAPTION_STYLE_KEY,
      JSON.stringify({ fontScale: 120, edgeStyle: 'outline' }),
    );

    expect(readCaptionStyle()).toMatchObject({ fontScale: 120, outlineThickness: 1 });
  });

  it('reads back what was saved', () => {
    saveCaptionStyle({ ...DEFAULT_CAPTION_STYLE, fontScale: 150, edgeStyle: 'shadow' });

    expect(readCaptionStyle()).toMatchObject({ fontScale: 150, edgeStyle: 'shadow' });
  });

  it('falls back to the defaults rather than throwing on a stale setting', () => {
    platformInUse().store.write(CAPTION_STYLE_KEY, '{"fontScale":"enormous"}');

    expect(readCaptionStyle()).toEqual(DEFAULT_CAPTION_STYLE);
  });

  it('falls back to the defaults when the stored value is not even JSON', () => {
    platformInUse().store.write(CAPTION_STYLE_KEY, 'not json');

    expect(readCaptionStyle()).toEqual(DEFAULT_CAPTION_STYLE);
  });

  it('refuses a size outside what is readable', () => {
    platformInUse().store.write(CAPTION_STYLE_KEY, '{"fontScale":5000}');

    expect(readCaptionStyle()).toEqual(DEFAULT_CAPTION_STYLE);
  });

  it('keeps it under the name the web always kept it under, so nobody’s captions reset', () => {
    expect(CAPTION_STYLE_KEY).toBe('valence.captionStyle');
  });
});
