import { describe, expect, it } from 'vitest';
import { settingsInAddress } from './settingsInAddress';

describe('settingsInAddress', () => {
  it('reads the named settings from the query', () => {
    expect(
      settingsInAddress('https://api.telegram.org/bot1:abc/sendMessage?chat_id=-100123&x=1', [
        'chat_id',
        'message_thread_id',
      ]),
    ).toStrictEqual({ chat_id: '-100123' });
  });

  it('leaves out a setting given with nothing in it', () => {
    expect(settingsInAddress('https://example.com/?user=', ['user'])).toStrictEqual({});
  });

  it('reads nothing from something that is not an address', () => {
    expect(settingsInAddress('not an address', ['user'])).toStrictEqual({});
  });
});
