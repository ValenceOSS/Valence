import { describe, expect, it } from 'vitest';
import { aRelease } from '@ValenceRequests/testing/aRelease';
import { withoutRepeats } from './withoutRepeats';

const HASH = 'a'.repeat(40);

describe('withoutRepeats', () => {
  it('keeps the same torrent once, from the indexer asked first', () => {
    const first = aRelease('Dune.2021.1080p', { id: 'one', infoHash: HASH });
    const again = aRelease('Dune 2021 1080p', { id: 'two', indexerId: 'other', infoHash: HASH });

    expect(withoutRepeats([first, again])).toEqual([first]);
  });

  it('keeps a release once by its name and size where it carries no hash', () => {
    const first = aRelease('Dune.2021.1080p', { id: 'one', protocol: 'usenet', sizeBytes: 5 });
    const again = aRelease('dune.2021.1080p', { id: 'two', protocol: 'usenet', sizeBytes: 5 });
    const bigger = aRelease('Dune.2021.1080p', { id: 'three', protocol: 'usenet', sizeBytes: 9 });

    expect(withoutRepeats([first, again, bigger])).toEqual([first, bigger]);
  });
});
