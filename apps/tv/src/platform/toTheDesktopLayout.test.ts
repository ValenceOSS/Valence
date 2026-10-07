import { toTheDesktopLayout } from '@ValenceTv/platform/toTheDesktopLayout';

describe('toTheDesktopLayout', () => {
  it('offers nothing on a television app, which has no other layout', () => {
    expect(toTheDesktopLayout()).toBeNull();
  });
});
