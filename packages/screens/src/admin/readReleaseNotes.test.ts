import { describe, expect, it } from 'vitest';
import { readReleaseNotes } from './readReleaseNotes';

const WRITTEN = `## [1.6.0](https://github.com/ValenceOSS/Valence/compare/v1.5.0...v1.6.0) (2026-10-13)


### Added

* hdr tone mapped in the browser ([#607](https://github.com/x/y/issues/607)) ([8785fb9](https://github.com/x/y/commit/8785fb9))
* **mobile:** a redesigned player ([#603](https://github.com/x/y/issues/603))


### Fixed

* **server:** the web app drew a blank page ([8f2fc92](https://github.com/x/y/commit/8f2fc92))
`;

const GENERATED = `## What's Changed
* fix(tv): the top shelf says it needs arm64 by @MarquesCoding in https://github.com/ValenceOSS/Valence/pull/538
* feat(server,web): keep the release from anybody by @dcm2610 in https://github.com/ValenceOSS/Valence/pull/542
* Redesign landing navigation by @MarquesCoding in https://github.com/ValenceOSS/Valence/pull/557

## New Contributors
* @someone made their first contribution in https://github.com/ValenceOSS/Valence/pull/530

**Full Changelog**: https://github.com/ValenceOSS/Valence/compare/v1.4.0...v1.5.0
`;

describe('readReleaseNotes', () => {
  it('reads the sections release-please writes, keeping each scope and pull request apart', () => {
    expect(readReleaseNotes(WRITTEN)).toEqual([
      {
        kind: 'written',
        heading: 'Added',
        points: [
          {
            text: 'Hdr tone mapped in the browser',
            scope: null,
            pull: { number: '607', url: 'https://github.com/x/y/issues/607' },
            author: null,
          },
          {
            text: 'A redesigned player',
            scope: 'mobile',
            pull: { number: '603', url: 'https://github.com/x/y/issues/603' },
            author: null,
          },
        ],
      },
      {
        kind: 'written',
        heading: 'Fixed',
        points: [
          { text: 'The web app drew a blank page', scope: 'server', pull: null, author: null },
        ],
      },
    ]);
  });

  it('groups the notes GitHub generates by the kind of change, without the links or contributors', () => {
    expect(readReleaseNotes(GENERATED)).toEqual([
      {
        kind: 'added',
        points: [
          {
            text: 'Keep the release from anybody',
            scope: 'server, web',
            pull: { number: '542', url: 'https://github.com/ValenceOSS/Valence/pull/542' },
            author: 'dcm2610',
          },
        ],
      },
      {
        kind: 'fixed',
        points: [
          {
            text: 'The top shelf says it needs arm64',
            scope: 'tv',
            pull: { number: '538', url: 'https://github.com/ValenceOSS/Valence/pull/538' },
            author: 'MarquesCoding',
          },
        ],
      },
      {
        kind: 'other',
        points: [
          {
            text: 'Redesign landing navigation',
            scope: null,
            pull: { number: '557', url: 'https://github.com/ValenceOSS/Valence/pull/557' },
            author: 'MarquesCoding',
          },
        ],
      },
    ]);
  });

  it('reads nothing from notes with no points', () => {
    expect(readReleaseNotes('Just a line.')).toEqual([]);
  });
});
