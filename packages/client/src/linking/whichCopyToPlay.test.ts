import { describe, expect, it } from 'vitest';
import { whichCopyToPlay } from './whichCopyToPlay';

const COPIES = [{ id: 'linked-4k' }, { id: 'directors-cut' }];

describe('whichCopyToPlay', () => {
  it('plays what was picked, over a resume and the best copy', () => {
    expect(whichCopyToPlay('own', COPIES, 'own', 'linked-4k', 'linked-4k')).toBe('own');
  });

  it('resumes this server’s own copy where the progress was made on it, though a better one is preferred', () => {
    expect(whichCopyToPlay('own', COPIES, null, null, 'linked-4k')).toBe('own');
  });

  it('resumes the linked copy the progress was made on', () => {
    expect(whichCopyToPlay('own', COPIES, null, 'linked-4k', null)).toBe('linked-4k');
  });

  it('resumes this server’s own copy where the copy resumed in has gone', () => {
    expect(whichCopyToPlay('own', COPIES, null, 'vanished', 'linked-4k')).toBe('own');
  });

  it('starts the preferred copy where there is nothing to resume', () => {
    expect(whichCopyToPlay('own', COPIES, null, undefined, 'linked-4k')).toBe('linked-4k');
  });

  it('starts this server’s own copy where nothing is preferred', () => {
    expect(whichCopyToPlay('own', COPIES, null, undefined, null)).toBe('own');
  });
});
