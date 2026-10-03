import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { askLinkedServer } from './askLinkedServer';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('askLinkedServer', () => {
  it('asks a linked server for a title, and says what was asked for', async () => {
    const asked = aServerAnswering({ title: 'The Matrix', isNew: true }, 201);
    const sent = await askLinkedServer('films server', {
      kind: 'film',
      tmdbId: 603,
      seasons: null,
    });

    expect(sent).toEqual({ value: { title: 'The Matrix', isNew: true }, refusal: null });
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/films%20server/requests');
    expect(asked.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });

  it('says why a linked server refused', async () => {
    aServerAnswering(
      {
        error: 'That server takes no requests from yours.',
        code: 'error.linking.thatServerTakesNoRequestsFromYours',
        values: {},
      },
      403,
    );

    const sent = await askLinkedServer('films', { kind: 'film', tmdbId: 603, seasons: null });

    expect(sent.value).toBeNull();
    expect(sent.refusal?.message).toBe('That server takes no requests from yours.');
  });
});
