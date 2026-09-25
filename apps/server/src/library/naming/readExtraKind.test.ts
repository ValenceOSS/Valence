import { describe, expect, it } from 'vitest';
import { readExtraKind } from './readExtraKind';
import type { ExtraKind } from '@ValenceContracts/schemas/Library';

const BY_NAME: [string, ExtraKind | null][] = [
  ['trailer.mp4', 'trailer'],
  ['300-trailer.mp4', 'trailer'],
  ['300.trailer.mp4', 'trailer'],
  ['300_trailer.mp4', 'trailer'],
  ['300 - trailer.mp4', 'trailer'],
  ['stuff trailerthings.mkv', null],
  ['300-scene.mp4', 'scene'],
  ['300-scene2.mp4', 'scene'],
  ['300-clip.mp4', 'clip'],
  ['300-deleted.mp4', 'deletedScene'],
  ['300-deletedscene.mp4', 'deletedScene'],
  ['300-interview.mp4', 'interview'],
  ['300-behindthescenes.mp4', 'behindTheScenes'],
  ['300-featurette.mp4', 'featurette'],
  ['300-short.mp4', 'short'],
  ['300-extra.mp4', 'other'],
  ['300-other.mp4', 'other'],
];

const BY_FOLDER: [string, ExtraKind][] = [
  ['behind the scenes', 'behindTheScenes'],
  ['deleted scenes', 'deletedScene'],
  ['interviews', 'interview'],
  ['scenes', 'scene'],
  ['samples', 'sample'],
  ['shorts', 'short'],
  ['trailers', 'trailer'],
  ['featurettes', 'featurette'],
  ['clips', 'clip'],
  ['backdrops', 'other'],
  ['extra', 'other'],
  ['extras', 'other'],
  ['other', 'other'],
];

const NOT_EXTRAS = ['gibberish', 'not a scene', 'The Big Short'];

describe('readExtraKind', () => {
  it.each(BY_NAME)('reads %j as %j', (name, kind) => {
    expect(readExtraKind(`/movies/300/${name}`, '/movies')).toBe(kind);
  });

  it.each(BY_FOLDER)('reads a file in %j as %j', (folder, kind) => {
    expect(readExtraKind(`/movies/300/${folder}/something.mkv`, '/movies')).toBe(kind);
    expect(readExtraKind(`/data/something/Movies/300/${folder}/whoknows.mp4`, '/data')).toBe(kind);
  });

  it.each(NOT_EXTRAS)('does not read a folder called %j as extras', (folder) => {
    expect(readExtraKind(`/movies/300/${folder}/something.mkv`, '/movies')).toBeNull();
    expect(readExtraKind(`/movies/${folder}/${folder}.mp4`, '/movies')).toBeNull();
  });

  it.each(BY_FOLDER)('does not read the library root called %j as extras', (folder) => {
    const root = `/data/something/${folder}`;

    expect(readExtraKind(`${root}/300.mp4`, root)).toBeNull();
    expect(readExtraKind(`${root}/300/${folder}/something.mkv`, root)).toBe(
      BY_FOLDER.find(([name]) => name === folder)?.[1],
    );
  });

  it('does not read a film called Other People as an extra', () => {
    expect(
      readExtraKind('/movies/Other People (2016)/Other.People.2016.mkv', '/movies'),
    ).toBeNull();
  });
});
