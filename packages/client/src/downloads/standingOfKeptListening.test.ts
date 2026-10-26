import { describe, expect, it } from 'vitest';
import { aKeptListening } from '@ValenceClient/testing/aKeptListening';
import { aTrack } from '@ValenceClient/testing/aTrack';
import type { KeptListeningFile } from '@ValenceContracts/schemas/KeptListening';
import { standingOfKeptListening } from './standingOfKeptListening';

const ALBUM = aKeptListening();

const ART = `artwork-album-${ALBUM.id}.jpg`;

const ONE = `track-${aTrack(1).id}-lossless.flac`;

const TWO = `track-${aTrack(2).id}-lossless.flac`;

const PLAYS_ANYTHING = () => true;

/**
 * A file on the shelf.
 *
 * @param name - What it is called.
 * @param state - How far it has got.
 * @param over - Anything else about it that matters.
 * @returns The file.
 */
const aFile = (
  name: string,
  state: KeptListeningFile['state'],
  over: Partial<KeptListeningFile> = {},
): KeptListeningFile => ({
  name,
  from: '/api/music/tracks',
  state,
  bytes: 100,
  ofBytes: 100,
  failure: null,
  ...over,
});

/**
 * How the album stands with some files on the shelf.
 *
 * @param files - The files.
 * @returns How it stands.
 */
const standingWith = (files: KeptListeningFile[]) =>
  standingOfKeptListening({ kept: [ALBUM], files }, ALBUM, PLAYS_ANYTHING);

describe('standingOfKeptListening', () => {
  it('has it all once every song is here, without waiting on the artwork', () => {
    expect(standingWith([aFile(ART, 'fetching'), aFile(ONE, 'here'), aFile(TWO, 'here')])).toEqual({
      state: 'here',
      filesHere: 2,
      filesInAll: 2,
      bytes: 200,
      failure: null,
    });
  });

  it('is fetching while any song is on its way, even beside one that failed', () => {
    expect(
      standingWith([
        aFile(ONE, 'failed', { failure: 'There is no room left' }),
        aFile(TWO, 'fetching', { bytes: 30 }),
      ]),
    ).toEqual({
      state: 'fetching',
      filesHere: 0,
      filesInAll: 2,
      bytes: 130,
      failure: 'There is no room left',
    });
  });

  it('has failed where a song failed and nothing is on its way', () => {
    expect(
      standingWith([aFile(ONE, 'here'), aFile(TWO, 'failed', { failure: 'Gone' })]),
    ).toMatchObject({ state: 'failed', filesHere: 1, failure: 'Gone' });
  });

  it('is paused where nothing is on its way and nothing failed', () => {
    expect(standingWith([aFile(ONE, 'here'), aFile(TWO, 'paused')]).state).toBe('paused');
  });

  it('is paused where its files are not on the shelf at all', () => {
    expect(standingWith([])).toMatchObject({ state: 'paused', filesHere: 0, bytes: 0 });
  });

  it('counts the songs at the quality this device keeps them at', () => {
    const high = `track-${aTrack(1).id}-high.m4a`;

    expect(
      standingOfKeptListening(
        { kept: [ALBUM], files: [aFile(high, 'here'), aFile(ONE, 'here')] },
        { ...ALBUM, tracks: [aTrack(1)] },
        () => false,
      ),
    ).toMatchObject({ state: 'here', filesHere: 1, filesInAll: 1, bytes: 100 });
  });
});
