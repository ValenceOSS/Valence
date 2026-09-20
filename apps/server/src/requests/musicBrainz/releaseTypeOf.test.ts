import { describe, expect, it } from 'vitest';
import { releaseTypeOf } from './releaseTypeOf';

describe('releaseTypeOf', () => {
  it('reads albums, EPs and singles by their primary type', () => {
    expect(releaseTypeOf('Album', [])).toBe('album');
    expect(releaseTypeOf('EP', [])).toBe('ep');
    expect(releaseTypeOf('Single', [])).toBe('single');
  });

  it('reads live records and compilations by what they are besides', () => {
    expect(releaseTypeOf('Album', ['Live'])).toBe('live');
    expect(releaseTypeOf('Album', ['Compilation'])).toBe('compilation');
  });

  it('leaves out soundtracks, remixes and anything without a type', () => {
    expect(releaseTypeOf('Album', ['Soundtrack'])).toBeNull();
    expect(releaseTypeOf('Album', ['Remix'])).toBeNull();
    expect(releaseTypeOf('Broadcast', [])).toBeNull();
    expect(releaseTypeOf(null, [])).toBeNull();
  });
});
