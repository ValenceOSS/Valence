import { describe, expect, it } from 'vitest';
import { missingAddressSettings } from './missingAddressSettings';

describe('missingAddressSettings', () => {
  it('names the chat a Telegram address leaves out', () => {
    expect(
      missingAddressSettings('telegram', 'https://api.telegram.org/bot1:abc/sendMessage'),
    ).toStrictEqual(['chat_id']);
  });

  it('names nothing once the address carries it', () => {
    expect(
      missingAddressSettings(
        'telegram',
        'https://api.telegram.org/bot1:abc/sendMessage?chat_id=-100123',
      ),
    ).toStrictEqual([]);
  });

  it('names each of the Pushover keys that is missing', () => {
    expect(
      missingAddressSettings('pushover', 'https://api.pushover.net/1/messages.json?token=a'),
    ).toStrictEqual(['user']);
  });

  it('asks nothing of a shape whose address is all it needs', () => {
    expect(missingAddressSettings('discord', 'https://discord.com/api/webhooks/1/x')).toStrictEqual(
      [],
    );
  });
});
