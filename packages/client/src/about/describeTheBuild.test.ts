import { describe, expect, it } from 'vitest';
import { describeTheBuild } from './describeTheBuild';

const BUILD = {
  version: '1.2.0',
  commit: '2ae1bc1',
  runsOn: 'arm64 · Electron 33.0.0 · Chromium 130.0.0',
};

describe('describeTheBuild', () => {
  it('names the client and the server it is talking to', () => {
    expect(describeTheBuild(BUILD, 'f00cafe')).toBe(
      'Valence 1.2.0 (2ae1bc1) · arm64 · Electron 33.0.0 · Chromium 130.0.0 · Server f00cafe',
    );
  });

  it('names only the client where no server has answered', () => {
    expect(describeTheBuild(BUILD, null)).toBe(
      'Valence 1.2.0 (2ae1bc1) · arm64 · Electron 33.0.0 · Chromium 130.0.0',
    );
  });

  it('leaves out the commit of a build that cannot say which it came from', () => {
    expect(describeTheBuild({ ...BUILD, commit: null, runsOn: 'iOS 27.0 · iPhone' }, null)).toBe(
      'Valence 1.2.0 · iOS 27.0 · iPhone',
    );
  });

  it('names only the server in a browser, which has no build of its own', () => {
    expect(describeTheBuild(null, 'f00cafe')).toBe('Server f00cafe');
  });

  it('says nothing where neither is known', () => {
    expect(describeTheBuild(null, null)).toBeNull();
  });
});
