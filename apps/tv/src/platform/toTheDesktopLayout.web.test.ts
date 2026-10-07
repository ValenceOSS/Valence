import { toTheDesktopLayout } from '@ValenceTv/platform/toTheDesktopLayout';

describe('toTheDesktopLayout in a browser', () => {
  it('chooses the web app’s layout for this browser and shows it', () => {
    const reload = jest.fn();
    const page = { cookie: '', location: { reload } };
    const choose: (asked: {
      cookie: string;
      location: { reload: () => void };
    }) => (() => void) | null = toTheDesktopLayout;

    choose(page)?.();

    expect(page.cookie).toContain('valence-layout=web');
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
