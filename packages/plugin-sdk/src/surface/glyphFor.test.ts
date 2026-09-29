import { describe, expect, it } from 'vitest';
import { ICON_NAMES } from './ICON_NAMES';
import { glyphFor } from './glyphFor';
import type { IconGlyphName } from './ICON_GLYPHS';

const SET: Readonly<Record<IconGlyphName, string>> = {
  CircleAlert: 'CircleAlert',
  Book: 'Book',
  Check: 'Check',
  Clock: 'Clock',
  Download: 'Download',
  Film: 'Film',
  Heart: 'Heart',
  Info: 'Info',
  Link: 'Link',
  List: 'List',
  MusicNote: 'MusicNote',
  Play: 'Play',
  Plus: 'Plus',
  RefreshCw: 'RefreshCw',
  Search: 'Search',
  Settings: 'Settings',
  Star: 'Star',
  Bin: 'Bin',
  Monitor: 'Monitor',
  Upload: 'Upload',
  CircleUser: 'CircleUser',
  X: 'X',
};

describe('glyphFor', () => {
  it('draws each icon name as its Keyline icon', () => {
    expect(glyphFor(SET, 'alert')).toBe('CircleAlert');
    expect(glyphFor(SET, 'trash')).toBe('Bin');
    expect(glyphFor(SET, 'user')).toBe('CircleUser');
  });

  it('has a picture for every icon a plugin may ask for', () => {
    expect(ICON_NAMES.map((name) => glyphFor(SET, name)).every((drawn) => drawn !== '')).toBe(true);
  });
});
