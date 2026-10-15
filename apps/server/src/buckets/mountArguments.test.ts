import { describe, expect, it } from 'vitest';
import { mountArguments } from './mountArguments';

describe('mountArguments', () => {
  it('mounts the bucket on its folder, caching whole files where it was told', () => {
    const args = mountArguments('valence:films', '/buckets/films', '/cache/buckets/films');

    expect(args.slice(0, 3)).toEqual(['mount', 'valence:films', '/buckets/films']);
    expect(args.join(' ')).toContain('--vfs-cache-mode full');
    expect(args.join(' ')).toContain('--cache-dir /cache/buckets/films');
  });

  it('lets the requests service, running as another user, write into it', () => {
    const args = mountArguments('valence:films', '/buckets/films', '/cache');

    expect(args).toContain('--allow-other');
    expect(args.join(' ')).toContain('--umask 000');
  });
});
