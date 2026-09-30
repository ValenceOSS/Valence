import { describe, expect, it } from 'vitest';
import { saying } from './saying';
import { sayVerbatim } from './sayVerbatim';

describe('saying', () => {
  it('holds the code, the English and the values', () => {
    expect(
      saying('requests.downloads.clientAnsweredStatus', { name: 'NZBGet', status: 500 }),
    ).toEqual({
      code: 'requests.downloads.clientAnsweredStatus',
      message: 'NZBGet answered 500',
      values: { name: 'NZBGet', status: 500 },
    });
  });

  it('writes something said inside it into the English by its own words', () => {
    const said = saying('requests.downloads.clientSaid', {
      name: 'SABnzbd',
      said: sayVerbatim('out of space'),
    });

    expect(said.message).toBe('SABnzbd said: out of space');
    expect(said.values['said']).toEqual({ code: null, message: 'out of space', values: {} });
  });
});
