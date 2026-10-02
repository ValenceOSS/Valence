import { describe, expect, it } from 'vitest';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { nativeTranscoderFor } from './nativeTranscoderFor';

describe('nativeTranscoderFor', () => {
  it('points a Mac at the page for running the transcoder natively there', () => {
    expect(nativeTranscoderFor('mac')).toStrictEqual({
      label: 'Hardware transcoding on a Mac',
      url: `${DOCS_URL}/install/hardware-transcoding-on-a-mac`,
    });
  });

  it('points Windows at its own page', () => {
    expect(nativeTranscoderFor('windows')).toStrictEqual({
      label: 'Hardware transcoding on Windows',
      url: `${DOCS_URL}/install/hardware-transcoding-on-windows`,
    });
  });

  it.each(['linux', 'iphone', 'android', 'unknown'] as const)('offers %s nothing', (platform) => {
    expect(nativeTranscoderFor(platform)).toBeNull();
  });
});
