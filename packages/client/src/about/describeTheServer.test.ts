import { describe, expect, it } from 'vitest';
import { describeTheServer } from './describeTheServer';

describe('describeTheServer', () => {
  it('names the release and the commit', () => {
    expect(describeTheServer({ version: '1.2.0', commit: 'e68dd35', features: [] })).toBe(
      'Server 1.2.0 (e68dd35)',
    );
  });

  it('names only the release of a server that could not read its commit', () => {
    expect(describeTheServer({ version: '1.2.0', commit: 'unknown', features: [] })).toBe(
      'Server 1.2.0',
    );
  });

  it('names only the commit of a server older than the release being asked', () => {
    expect(describeTheServer({ commit: 'e68dd35', features: [] })).toBe('Server e68dd35');
  });

  it('says nothing rather than "Server unknown"', () => {
    expect(describeTheServer({ commit: 'unknown', features: [] })).toBeNull();
    expect(describeTheServer(null)).toBeNull();
  });
});
