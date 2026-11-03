import { describe, expect, it } from 'vitest';
import { devCommitOf } from './devCommitOf';

describe('devCommitOf', () => {
  it('reads the commit a development build was made from', () => {
    expect(devCommitOf('1.9.0-dev.3a2e85d')).toBe('3a2e85d');
  });

  it('finds no commit in a release', () => {
    expect(devCommitOf('1.8.0')).toBeNull();
  });

  it('finds no commit in a dev tag that names none, or in a build made by hand', () => {
    expect(devCommitOf('1.9.0-dev')).toBeNull();
    expect(devCommitOf('3a2e85d-nightly')).toBeNull();
  });
});
