import { describe, expect, it } from 'vitest';
import { PLAYBACK_PROBLEM_NAMES } from '@ValenceContracts/schemas/PlaybackProblem';
import { describePlaybackProblem } from './describePlaybackProblem';

describe('describePlaybackProblem', () => {
  it('says plainly that a damaged file is damaged, and who to tell', () => {
    expect(describePlaybackProblem('damaged')).toEqual({
      code: 101,
      group: 'file',
      heading: 'This file is damaged',
      line: 'Let your server’s admin know so they can replace it.',
      action: null,
    });
  });

  it('offers to try again only for what can pass', () => {
    expect(describePlaybackProblem('unreachable').action).toBe('retry');
    expect(describePlaybackProblem('streamLost').action).toBe('retry');
    expect(describePlaybackProblem('unsupported').action).toBeNull();
  });

  it('offers to sign in where the sign-in lapsed', () => {
    expect(describePlaybackProblem('signedOut').action).toBe('signIn');
  });

  it('says why an admin stopped a stream, where they said', () => {
    expect(describePlaybackProblem('stopped', 'Server restarting for an update').line).toBe(
      'Server restarting for an update',
    );
    expect(describePlaybackProblem('stopped').line).toBe('Your server’s admin stopped it.');
  });

  it('has a heading and a line for every problem', () => {
    for (const problem of PLAYBACK_PROBLEM_NAMES) {
      const described = describePlaybackProblem(problem);

      expect(described.heading).not.toBe('');
      expect(described.line).not.toBe('');
    }
  });
});
