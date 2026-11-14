import { describe, expect, it } from 'vitest';
import { aJellyfinServer } from './testing/aJellyfinServer';

describe('registerJellyfinImages', () => {
  it('send a picture by its tag without a token, narrowed to the size asked for', async () => {
    const { ask } = aJellyfinServer();
    const answer = await ask(
      '/Items/x/Images/Primary?tag=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&maxWidth=300',
      { token: null },
    );

    expect(answer.status).toBe(200);
    expect(await answer.text()).toBe('w342');
    expect(answer.headers.get('cache-control')).toContain('immutable');
  });

  it('look a picture up for whoever is signed in where it is asked for without a tag', async () => {
    const { ask, film } = aJellyfinServer();

    expect(
      await (
        await ask(`/Items/${film.id.replaceAll('-', '')}/Images/Primary?fillWidth=1000`)
      ).text(),
    ).toBe('w0');
    expect(
      (await ask(`/Items/${film.id.replaceAll('-', '')}/Images/Primary`, { token: null })).status,
    ).toBe(404);
  });
});
