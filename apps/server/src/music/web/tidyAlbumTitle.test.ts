import { describe, expect, it } from 'vitest';
import { tidyAlbumTitle } from './tidyAlbumTitle';

describe('tidyAlbumTitle', () => {
  it('takes a year off the end', () => {
    expect(tidyAlbumTitle('Silent Alarm 2005')).toBe('Silent Alarm');
    expect(tidyAlbumTitle('Silent Alarm (2005)')).toBe('Silent Alarm');
  });

  it('takes the kind of record off the end', () => {
    expect(tidyAlbumTitle('Bangarang EP')).toBe('Bangarang');
  });

  it('takes an edition in brackets off', () => {
    expect(tidyAlbumTitle('Visions (Deluxe Edition)')).toBe('Visions');
    expect(tidyAlbumTitle('Scorpion [Remastered]')).toBe('Scorpion');
  });

  it('leaves a title that is only what it is called alone', () => {
    expect(tidyAlbumTitle('Even In Arcadia')).toBe('Even In Arcadia');
    expect(tidyAlbumTitle('1989')).toBe('1989');
  });
});
