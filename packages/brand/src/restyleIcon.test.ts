import { describe, expect, it } from 'vitest';
import { restyleIcon } from './restyleIcon';

const DOCUMENT = JSON.stringify({
  fill: { 'automatic-gradient': 'extended-srgb:0,0.5,1,1' },
  groups: [
    {
      layers: [
        { name: 'logo', 'image-name': 'logo.svg', hidden: false },
        { name: 'spare', hidden: true },
      ],
      shadow: { kind: 'neutral', opacity: 0.5 },
    },
  ],
  'supported-platforms': { squares: 'shared' },
});

describe('restyleIcon', () => {
  it('paints another background, keeping everything the designer set', () => {
    expect(JSON.parse(restyleIcon(DOCUMENT, { background: 'extended-srgb:0,0,0,1' }))).toEqual({
      ...JSON.parse(DOCUMENT),
      fill: { solid: 'extended-srgb:0,0,0,1' },
    });
  });

  it('hides every layer so only the background is drawn', () => {
    expect(JSON.parse(restyleIcon(DOCUMENT, { isArtworkHidden: true }))).toMatchObject({
      fill: { 'automatic-gradient': 'extended-srgb:0,0.5,1,1' },
      groups: [
        {
          layers: [
            { name: 'logo', hidden: true },
            { name: 'spare', hidden: true },
          ],
          shadow: { kind: 'neutral', opacity: 0.5 },
        },
      ],
    });
  });

  it('refuses something that is not an Icon Composer document', () => {
    expect(() => restyleIcon('{"layers":[]}', {})).toThrow();
  });
});
