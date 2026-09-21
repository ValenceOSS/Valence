import { describe, expect, it } from 'vitest';
import { describeRunSubject } from './describeRunSubject';
import type { Library } from '@ValenceContracts/schemas/Library';

const MOVIES: Library = {
  id: 'd3ecbc24-d083-4945-b2ab-000000000000',
  name: 'Movies',
  kind: 'movies',
  path: '/media/movies',
  itemCount: 107,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
};

describe('describeRunSubject', () => {
  it('names a library by its name rather than its identifier', () => {
    expect(describeRunSubject(MOVIES.id, [MOVIES], 'library.scan')).toEqual({
      name: 'Movies',
      library: MOVIES,
    });
  });

  it('leaves a subject that names no library as it was written', () => {
    expect(describeRunSubject('nightly', [MOVIES], 'library.scan')).toEqual({
      name: 'nightly',
      library: null,
    });
  });

  it.each([
    ['library.scan', 'Every library'],
    ['library.detectSegments.scheduled', 'Every library'],
    ['server.checkDiskSpace', 'This server'],
    ['requests.scanFolder', 'Requests'],
    ['catalogue.rematch', 'The catalogue'],
    ['something.else', 'Everything'],
  ])('says a %s run with no subject was about %s', (kind, said) => {
    expect(describeRunSubject(null, [MOVIES], kind)).toEqual({ name: said, library: null });
  });

  it('says so for a library that has since been removed, rather than showing its code', () => {
    expect(describeRunSubject(MOVIES.id, [], 'library.scan')).toEqual({
      name: 'A library that has been removed',
      library: null,
    });
  });
});
