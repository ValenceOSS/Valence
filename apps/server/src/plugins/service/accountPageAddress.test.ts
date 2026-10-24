import { describe, expect, it } from 'vitest';
import { accountPageAddress } from './accountPageAddress';

describe('accountPageAddress', () => {
  it('opens the account area on the plugin’s page', () => {
    expect(accountPageAddress('trakt', 'home')).toBe('/?account=plugin.trakt.home');
  });
});
