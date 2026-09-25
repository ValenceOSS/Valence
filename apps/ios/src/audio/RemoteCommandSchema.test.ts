import { RemoteCommandSchema } from '@ValencePhone/audio/RemoteCommandSchema';

describe('RemoteCommandSchema', () => {
  it('reads what the lock screen asked of which speaker, and by how much', () => {
    expect(RemoteCommandSchema.parse({ channel: 'book', command: 'forward', seconds: 30 })).toEqual(
      { channel: 'book', command: 'forward', seconds: 30 },
    );
  });

  it('refuses a command or a speaker it does not know', () => {
    expect(RemoteCommandSchema.safeParse({ channel: 'book', command: 'eject' }).success).toBe(
      false,
    );
    expect(RemoteCommandSchema.safeParse({ channel: 'radio', command: 'play' }).success).toBe(
      false,
    );
  });
});
