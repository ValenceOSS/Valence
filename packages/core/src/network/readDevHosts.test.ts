import { describe, expect, it } from 'vitest';
import { readDevHosts } from './readDevHosts';

describe('reading the hosts a developer points at local services', () => {
  it('reads nothing from nothing', () => {
    expect(readDevHosts(undefined, 'development').size).toBe(0);
    expect(readDevHosts(' , ', 'production').size).toBe(0);
  });

  it('reads each name and where it really is', () => {
    const read = readDevHosts(
      'Files.Example.test=127.0.0.1:8443, api.example.test=[::1]:9000',
      'development',
    );

    expect(read.get('files.example.test')).toEqual({ address: '127.0.0.1', port: 8443 });
    expect(read.get('api.example.test')).toEqual({ address: '::1', port: 9000 });
  });

  it('refuses to run in production with any set', () => {
    expect(() => readDevHosts('files.example.test=127.0.0.1:8443', 'production')).toThrow(
      'refused in production',
    );
  });

  it.each(['files.example.test', 'files.example.test=127.0.0.1', 'x=127.0.0.1:0'])(
    'refuses %s',
    (value) => {
      expect(() => readDevHosts(value, 'development')).toThrow('not host=address:port');
    },
  );
});
