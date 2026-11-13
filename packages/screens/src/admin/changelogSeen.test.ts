import { afterEach, describe, expect, it } from 'vitest';
import { readChangelogSeen, saveChangelogSeen } from './changelogSeen';

describe('changelogSeen', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('has seen nothing on a device it has not been told of', () => {
    expect(readChangelogSeen()).toBeNull();
  });

  it('remembers the release seen', () => {
    saveChangelogSeen('1.9.0');

    expect(readChangelogSeen()).toBe('1.9.0');
  });

  it('forgets something it cannot read', () => {
    window.localStorage.setItem('valence.changelogSeen', '{not json');

    expect(readChangelogSeen()).toBeNull();
  });
});
