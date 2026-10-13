import { describe, expect, it } from 'vitest';
import { withTheAppStoreBanner } from './withTheAppStoreBanner';

const PAGE = '<html><head><title>Valence</title></head><body></body></html>';

describe('withTheAppStoreBanner', () => {
  it('names the listing and where Open takes the app, in the head', () => {
    expect(withTheAppStoreBanner(PAGE, '6815748526', 'valence://open?server=x')).toBe(
      '<html><head><title>Valence</title><meta name="apple-itunes-app" content="app-id=6815748526, app-argument=valence://open?server=x"></head><body></body></html>',
    );
  });

  it('escapes the link so it cannot leave the attribute', () => {
    expect(
      withTheAppStoreBanner(PAGE, '1', 'valence://device?user_code=AB&server="><script>'),
    ).toContain(
      'content="app-id=1, app-argument=valence://device?user_code=AB&amp;server=&quot;&gt;&lt;script&gt;"',
    );
  });

  it('leaves a page with no head as it is', () => {
    expect(withTheAppStoreBanner('<p>hi</p>', '1', 'valence://open')).toBe('<p>hi</p>');
  });
});
