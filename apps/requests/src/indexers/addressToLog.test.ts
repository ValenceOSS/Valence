import { describe, expect, it } from 'vitest';
import { addressToLog } from './addressToLog';

describe('addressToLog', () => {
  it('shows what was searched for', () => {
    expect(addressToLog('https://animetracker.example/?f=0&q=Some+Show')).toBe(
      'https://animetracker.example/?f=0&q=Some+Show',
    );
  });

  it('masks keys, passkeys and tokens', () => {
    expect(
      addressToLog(
        'https://indexer.example/api?t=search&q=dune&apikey=abc123&passkey=def&rsstoken=x',
      ),
    ).toBe('https://indexer.example/api?t=search&q=dune&apikey=***&passkey=***&rsstoken=***');
  });

  it('leaves something that is not an address as it is', () => {
    expect(addressToLog('not an address')).toBe('not an address');
  });
});
