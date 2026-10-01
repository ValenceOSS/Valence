import { describe, expect, it } from 'vitest';
import { createPlayTracker } from './createPlayTracker';
import type { PresenceEntry } from '@ValenceServer/presence/PresenceService';

type Said = {
  itemId: string;
  positionSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
};

const LAPTOP: PresenceEntry = {
  clientId: 'laptop',
  accountId: 'acc',
  profileId: 'me',
  profileName: 'Marques',
  guestOf: null,
  viaShare: null,
  address: null,
  deviceLabel: 'Laptop',
  clientKind: null,
  connectedAt: 0,
  playback: null,
};

/**
 * A tracker on a clock the test moves, writing down every start and stop it reports.
 *
 * @returns The tracker, the record, and how to move the clock on.
 */
const aTracker = () => {
  let nowMs = 0;
  const told: string[] = [];
  const tracker = createPlayTracker<Said>({
    read: (said) => said,
    now: () => nowMs,
    onStarted: (play) => {
      told.push(`started ${play.report.itemId}`);
    },
    onStopped: (play, reached) => {
      told.push(
        `stopped ${play.report.itemId} at ${String(reached.positionSeconds)}/${String(reached.durationSeconds)}`,
      );
    },
  });

  return {
    say: (said: Said | null) => {
      tracker.report(LAPTOP, said);
    },
    wait: (seconds: number) => {
      nowMs += seconds * 1000;
    },
    told,
  };
};

const song = (itemId: string, positionSeconds: number, isPlaying = true): Said => ({
  itemId,
  positionSeconds,
  durationSeconds: 200,
  isPlaying,
});

describe('createPlayTracker', () => {
  it('starts a play once something is playing, and only once however often it is reported', () => {
    const { say, wait, told } = aTracker();

    say(song('a', 0, false));
    expect(told).toEqual([]);
    say(song('a', 0));
    wait(15);
    say(song('a', 15));
    wait(15);
    say(song('a', 30));

    expect(told).toEqual(['started a']);
  });

  it('stops a play where it had got to when the device moves on, working forward from the last report', () => {
    const { say, wait, told } = aTracker();

    say(song('a', 0));
    wait(15);
    say(song('a', 15));
    wait(10);
    say(song('b', 0));

    expect(told).toEqual(['started a', 'stopped a at 25/200', 'started b']);
  });

  it('takes a song that has run out and gone back to the start as having finished', () => {
    const { say, wait, told } = aTracker();

    say(song('a', 0));
    wait(190);
    say(song('a', 190));
    wait(15);
    say(song('a', 0, false));

    expect(told).toEqual(['started a', 'stopped a at 200/200']);
  });

  it('counts a song played again from the start as a second play', () => {
    const { say, wait, told } = aTracker();

    say(song('a', 0));
    wait(200);
    say(song('a', 0));

    expect(told).toEqual(['started a', 'stopped a at 200/200', 'started a']);
  });

  it('keeps one play through a pause and a seek back, remembering the furthest it reached', () => {
    const { say, wait, told } = aTracker();

    say(song('a', 0));
    wait(60);
    say(song('a', 60, false));
    wait(600);
    say(song('a', 30));
    wait(5);
    say(null);

    expect(told).toEqual(['started a', 'stopped a at 60/200']);
  });

  it('stops a play when the device says it is playing nothing or goes away', () => {
    const { say, wait, told } = aTracker();

    say(song('a', 0));
    wait(20);
    say(null);
    say(null);

    expect(told).toEqual(['started a', 'stopped a at 20/200']);
  });

  it('does not count a quick skip back to the start of a song barely begun as a second play', () => {
    const { say, wait, told } = aTracker();

    say(song('a', 0));
    wait(4);
    say(song('a', 0));

    expect(told).toEqual(['started a']);
  });
});
