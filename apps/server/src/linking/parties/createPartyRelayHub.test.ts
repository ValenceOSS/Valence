import { describe, expect, it } from 'vitest';
import { createPartyRelayHub } from './createPartyRelayHub';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const AN_EVENT = { kind: 'event', topic: 'party', atMs: 5, folded: 0, payload: {} } as const;

describe('createPartyRelayHub', () => {
  it('names somebody watching from a linked server by their server and connection there', () => {
    const hub = createPartyRelayHub();
    const member = hub.memberOf(FILMS, 'tab-1');

    expect(member).toBe(`peer~${FILMS}~tab-1`);
    expect(hub.isPeer(member)).toBe(true);
    expect(hub.isPeer('tab-2')).toBe(false);
  });

  it('keeps what a party says until their server hears it, their own people named as theirs', async () => {
    const hub = createPartyRelayHub();
    const sam = hub.memberOf(FILMS, 'tab-1');

    hub.write(sam, {
      ...AN_EVENT,
      payload: { members: [sam, 'host-here'] },
    });

    expect(await hub.hear(FILMS, 1000)).toEqual([
      {
        connection: 'tab-1',
        message: { ...AN_EVENT, payload: { members: ['here~tab-1', 'host-here'] } },
      },
    ]);
    expect(await hub.hear(FILMS, 0)).toEqual([]);
  });

  it('answers a server waiting to hear as soon as there is something to say', async () => {
    const hub = createPartyRelayHub(() => 42);
    const hearing = hub.hear(FILMS, 60_000);

    hub.tell([hub.memberOf(FILMS, 'tab-1'), 'somebody-here'], { said: 'hello' });

    expect(await hearing).toEqual([
      {
        connection: 'tab-1',
        message: { kind: 'event', topic: 'party', atMs: 42, folded: 0, payload: { said: 'hello' } },
      },
    ]);
  });

  it('keeps nothing for somebody watching here', async () => {
    const hub = createPartyRelayHub();

    hub.write('tab-2', AN_EVENT);

    expect(await hub.hear(FILMS, 0)).toEqual([]);
  });

  it('names their people as this server knows them, in what their server says', () => {
    expect(createPartyRelayHub().asOurs(FILMS, '{"connectionId":"here~tab-1"}')).toBe(
      `{"connectionId":"peer~${FILMS}~tab-1"}`,
    );
  });
});
