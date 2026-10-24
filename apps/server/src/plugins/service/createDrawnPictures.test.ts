import { describe, expect, it } from 'vitest';
import { createDrawnPictures } from './createDrawnPictures';

const A = 'https://example.com/a.png';

describe('createDrawnPictures', () => {
  it('knows a picture only for the plugin and viewer it was drawn for, for an hour', () => {
    let clock = 0;
    const pictures = createDrawnPictures(() => clock);

    pictures.remember('anime', 'p1', [A]);

    expect(pictures.wasDrawn('anime', 'p1', A)).toBe(true);
    expect(pictures.wasDrawn('anime', 'p2', A)).toBe(false);
    expect(pictures.wasDrawn('other', 'p1', A)).toBe(false);

    clock += 60 * 60 * 1000 + 1;

    expect(pictures.wasDrawn('anime', 'p1', A)).toBe(false);
  });

  it('lets a viewer fetch a plugin’s pictures 600 times a minute', () => {
    let clock = 0;
    const pictures = createDrawnPictures(() => clock);
    const allowed = Array.from({ length: 610 }, () => pictures.mayFetch('anime', 'p1'));

    expect(allowed.filter(Boolean)).toHaveLength(600);
    expect(pictures.mayFetch('anime', 'p2')).toBe(true);

    clock += 60_001;

    expect(pictures.mayFetch('anime', 'p1')).toBe(true);
  });

  it('forgets what a removed plugin drew', () => {
    const pictures = createDrawnPictures(() => 0);

    pictures.remember('anime', 'p1', [A]);
    pictures.remember('animex', 'p1', [A]);
    pictures.forget('anime');

    expect(pictures.wasDrawn('anime', 'p1', A)).toBe(false);
    expect(pictures.wasDrawn('animex', 'p1', A)).toBe(true);
  });
});
