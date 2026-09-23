import { describe, expect, it } from 'vitest';
import { DownloadClientFailure } from './DownloadClientFailure';

describe('DownloadClientFailure', () => {
  it('carries the reason as its message', () => {
    const failure = new DownloadClientFailure('qBittorrent refused the password');

    expect(failure.message).toBe('qBittorrent refused the password');
    expect(failure.name).toBe('DownloadClientFailure');
    expect(failure).toBeInstanceOf(Error);
  });

  it('carries what kind of problem it is, where it is one there is help for', () => {
    expect(
      new DownloadClientFailure(
        'qBittorrent refused the username or password',
        'DownloadClientLoginRefused',
      ).problemCode,
    ).toBe('DownloadClientLoginRefused');
    expect(new DownloadClientFailure('Something else').problemCode).toBeNull();
  });
});
