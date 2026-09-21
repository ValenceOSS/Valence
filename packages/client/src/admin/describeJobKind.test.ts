import { describe, expect, it } from 'vitest';
import { describeJobKind } from './describeJobKind';

const LABELS = new Map([
  ['library.scan', 'Scan for changes'],
  ['library.detectSegments', 'Detect missing intros and outros'],
]);

describe('describeJobKind', () => {
  it('calls a kind the server offers what the server calls it', () => {
    expect(describeJobKind('library.scan', LABELS)).toBe('Scan for changes');
  });

  it('gives the copy that runs on a clock the same name, and says so', () => {
    expect(describeJobKind('library.detectSegments.scheduled', LABELS)).toBe(
      'Detect missing intros and outros (on its schedule)',
    );
  });

  it('puts a kind it has no name for into words from its identifier', () => {
    expect(describeJobKind('library.readAgain', LABELS)).toBe('Read again');
    expect(describeJobKind('requests.scanFolder', LABELS)).toBe('Scan folder');
  });

  it('does the same for the clock copy of a kind it has no name for', () => {
    expect(describeJobKind('library.regenerateTrickplay.scheduled', LABELS)).toBe(
      'Regenerate trickplay (on its schedule)',
    );
  });

  it('takes the words of a kind with no namespace as they are', () => {
    expect(describeJobKind('cleanup', LABELS)).toBe('Cleanup');
  });

  it('breaks words at dashes and underscores too', () => {
    expect(describeJobKind('server.prune_old-records', LABELS)).toBe('Prune old records');
  });

  it('leaves a kind that has nothing to make words from as it is', () => {
    expect(describeJobKind('library.', LABELS)).toBe('library.');
  });
});
