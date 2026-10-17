import { describe, expect, it } from 'vitest';
import { readReleaseNotes } from './readReleaseNotes';

const NOTES = `## [1.6.0](https://github.com/ValenceOSS/Valence/compare/v1.5.0...v1.6.0) (2026-10-13)


### Added

* hdr tone mapped in the browser ([#607](https://github.com/x/issues/607)) ([8785fb9](https://github.com/x/commit/8785fb9))
* **mobile:** a redesigned player ([#603](https://github.com/x/issues/603))


### Fixed

* **server:** the web app drew a blank page ([8f2fc92](https://github.com/x/commit/8f2fc92))
`;

describe('readReleaseNotes', () => {
  it('reads each section into plain points', () => {
    expect(readReleaseNotes(NOTES)).toEqual([
      {
        heading: 'Added',
        items: ['hdr tone mapped in the browser', 'mobile: a redesigned player'],
      },
      { heading: 'Fixed', items: ['server: the web app drew a blank page'] },
    ]);
  });

  it('reads nothing from notes with no points', () => {
    expect(readReleaseNotes('Just a line.')).toEqual([]);
  });
});
