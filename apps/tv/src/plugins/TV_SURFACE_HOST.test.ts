import { TV_SURFACE_HOST } from './TV_SURFACE_HOST';

describe('TV_SURFACE_HOST', () => {
  it('says a page that needs a browser should be opened on another device', async () => {
    await expect(
      TV_SURFACE_HOST.openOnServer('/api/plugins/anilist/accounts/anilist/connect'),
    ).rejects.toThrow(/on your phone or on the web/u);
  });
});
