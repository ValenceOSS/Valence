import { describe, expect, it } from 'vitest';
import { createAnswerKeeper } from './createAnswerKeeper';
import { troubleWatch } from './troubleWatch';

const counting = (answer: () => Promise<string | null>) => {
  let asked = 0;

  return {
    read: () => {
      asked += 1;

      return answer();
    },
    asked: () => asked,
  };
};

describe('createAnswerKeeper', () => {
  it('asks once for an answer and keeps it', async () => {
    const keeper = createAnswerKeeper<string | null>(1000);
    const { read, asked } = counting(() => Promise.resolve('an answer'));

    await keeper.keep('one', read);
    await expect(keeper.keep('one', read)).resolves.toBe('an answer');
    expect(asked()).toBe(1);
  });

  it('keeps a site saying it has nothing, since asking again would say the same', async () => {
    const keeper = createAnswerKeeper<string | null>(1000);
    const { read, asked } = counting(() => Promise.resolve(null));

    await keeper.keep('one', read);
    await keeper.keep('one', read);

    expect(asked()).toBe(1);
  });

  it('keeps an answer given while a site was failing for a minute, saying why, then asks again', async () => {
    let clock = 0;
    const keeper = createAnswerKeeper<string | null>(6 * 60 * 60 * 1000, { now: () => clock });
    let failing = true;
    const { read, asked } = counting(() => {
      if (failing) {
        troubleWatch.report({ source: 'TMDB', reason: 'rateLimited' });

        return Promise.resolve(null);
      }

      return Promise.resolve('an answer');
    });

    await keeper.keep('one', read);
    failing = false;

    await expect(troubleWatch.during(() => keeper.keep('one', read))).resolves.toEqual({
      value: null,
      trouble: { source: 'TMDB', reason: 'rateLimited' },
    });
    expect(asked()).toBe(1);

    clock = 60_000;

    await expect(keeper.keep('one', read)).resolves.toBe('an answer');
    expect(asked()).toBe(2);
  });

  it('asks again at once where the key was missing or refused, so a fixed key works straight away', async () => {
    const keeper = createAnswerKeeper<string | null>(1000);
    let refused = true;
    const { read, asked } = counting(() => {
      if (refused) {
        troubleWatch.report({ source: 'TMDB', reason: 'keyRefused' });

        return Promise.resolve(null);
      }

      return Promise.resolve('an answer');
    });

    await keeper.keep('one', read);
    refused = false;

    await expect(keeper.keep('one', read)).resolves.toBe('an answer');
    expect(asked()).toBe(2);
  });

  it('forgets a read that threw', async () => {
    const keeper = createAnswerKeeper<string | null>(1000);
    let throws = true;
    const { read } = counting(() =>
      throws ? Promise.reject(new Error('unreachable')) : Promise.resolve('an answer'),
    );

    await expect(keeper.keep('one', read)).rejects.toThrow('unreachable');
    throws = false;

    await expect(keeper.keep('one', read)).resolves.toBe('an answer');
  });

  it('tells everyone who shared a failing read what went wrong', async () => {
    const keeper = createAnswerKeeper<string | null>(1000);
    const { read, asked } = counting(async () => {
      await Promise.resolve();
      troubleWatch.report({ source: 'MusicBrainz', reason: 'unreachable' });

      return null;
    });

    const [first, second] = await Promise.all([
      troubleWatch.during(() => keeper.keep('one', read)),
      troubleWatch.during(() => keeper.keep('one', read)),
    ]);

    expect(asked()).toBe(1);
    expect(first.trouble).toEqual({ source: 'MusicBrainz', reason: 'unreachable' });
    expect(second.trouble).toEqual({ source: 'MusicBrainz', reason: 'unreachable' });
  });

  it('asks again once emptied', async () => {
    const keeper = createAnswerKeeper<string | null>(1000);
    const { read, asked } = counting(() => Promise.resolve('an answer'));

    await keeper.keep('one', read);
    keeper.clear();
    await keeper.keep('one', read);

    expect(asked()).toBe(2);
  });
});
