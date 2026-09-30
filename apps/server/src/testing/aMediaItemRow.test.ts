import { describe, expect, it } from 'vitest';
import { aMediaItemRow } from './aMediaItemRow';

describe('aMediaItemRow', () => {
  it('names the item, its library and a file of its own', () => {
    expect(aMediaItemRow('arrival', 'films')).toMatchObject({
      id: 'arrival',
      libraryId: 'films',
      path: '/films/arrival.mkv',
      title: 'arrival',
    });
  });
});
