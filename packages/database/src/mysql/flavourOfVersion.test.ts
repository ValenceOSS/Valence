import { describe, expect, it } from 'vitest';
import { flavourOfVersion } from './flavourOfVersion';

describe('flavourOfVersion', () => {
  it('knows MariaDB by its name in the version', () => {
    expect(flavourOfVersion('11.4.5-MariaDB-ubu2404')).toBe('mariadb');
  });

  it('takes anything else for MySQL', () => {
    expect(flavourOfVersion('8.4.11')).toBe('mysql');
  });
});
