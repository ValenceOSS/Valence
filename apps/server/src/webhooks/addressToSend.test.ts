import { describe, expect, it } from 'vitest';
import { addressToSend } from './addressToSend';

describe('addressToSend', () => {
  it('takes Pushover’s keys out of the address, since they go in the body', () => {
    expect(
      addressToSend(
        'pushover',
        'https://api.pushover.net/1/messages.json?token=app&user=me&sound=none',
      ),
    ).toBe('https://api.pushover.net/1/messages.json');
  });

  it('takes the Telegram chat and topic out, and leaves anything else', () => {
    expect(
      addressToSend(
        'telegram',
        'https://api.telegram.org/bot1:abc/sendMessage?chat_id=-100123&message_thread_id=7&x=1',
      ),
    ).toBe('https://api.telegram.org/bot1:abc/sendMessage?x=1');
  });

  it('leaves Gotify’s token where Gotify reads it', () => {
    expect(addressToSend('gotify', 'https://gotify.example.com/message?token=abc')).toBe(
      'https://gotify.example.com/message?token=abc',
    );
  });

  it('leaves the address of a shape that moves nothing exactly as it was given', () => {
    expect(addressToSend('discord', 'https://discord.com/api/webhooks/1/x?wait=true')).toBe(
      'https://discord.com/api/webhooks/1/x?wait=true',
    );
  });
});
