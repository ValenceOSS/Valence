import { describe, expect, it } from 'vitest';
import { gatherNotices } from './gatherNotices';

const notice = (title: string) => ({ title, body: `${title} body`, link: `/${title}` });

describe('gatherNotices', () => {
  it('shows a notice on its own where nothing else is on screen, with a sound', () => {
    expect(gatherNotices(null, notice('One'), 1000)).toEqual({
      title: 'One',
      body: 'One body',
      link: '/One',
      notices: [notice('One')],
      firstShownAt: 1000,
      renotify: true,
    });
  });

  it('gathers what arrives at once into one, quietly after the first', () => {
    const first = gatherNotices(null, notice('One'), 1000);
    const second = gatherNotices(first, notice('Two'), 2000);
    const third = gatherNotices(second, notice('Three'), 3000);

    expect(third).toMatchObject({
      title: '3 new notifications',
      body: 'One, Two, and Three',
      link: '/',
      firstShownAt: 1000,
      renotify: false,
    });
  });

  it('names the first few and counts the rest', () => {
    const shown = ['One', 'Two', 'Three', 'Four'].reduce<ReturnType<typeof gatherNotices> | null>(
      (showing, title) => gatherNotices(showing, notice(title), 1000),
      null,
    );

    expect(shown?.body).toBe('One, Two, Three and 1 more');
  });

  it('names a title said by several notices once', () => {
    const first = gatherNotices(null, notice('Same'), 1000);

    expect(gatherNotices(first, notice('Same'), 1500)).toMatchObject({
      title: '2 new notifications',
      body: 'Same',
    });
  });

  it('makes a sound again for a notice long after the one still on screen', () => {
    const first = gatherNotices(null, notice('One'), 0);

    expect(gatherNotices(first, notice('Two'), 3_600_000)).toMatchObject({
      title: '2 new notifications',
      firstShownAt: 3_600_000,
      renotify: true,
    });
  });
});
