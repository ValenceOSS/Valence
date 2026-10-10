import { toTheDesktopLayout } from '@ValenceTv/platform/toTheDesktopLayout';

describe('toTheDesktopLayout in a browser', () => {
  it('chooses the web app’s layout for this browser and shows it', () => {
    const reload = jest.fn();
    const choose: (asked: {
      cookie: string;
      location: { reload: () => void };
    }) => (() => void) | null = toTheDesktopLayout;

    const written: string[] = [];
    const watched = {
      set cookie(value: string) {
        written.push(value);
      },
      get cookie() {
        return written.join('; ');
      },
      location: { reload },
    };

    choose(watched)?.();

    expect(written.some((one) => one.startsWith('valence-layout-on-trial=1'))).toBe(true);
    expect(written.at(-1)).toContain('valence-layout=web');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('offers nothing on a television whose browser is too old for the web app', () => {
    const page = { cookie: '', location: { reload: jest.fn() } };
    const choose: (
      asked: { cookie: string; location: { reload: () => void } },
      userAgent: string,
    ) => (() => void) | null = toTheDesktopLayout;

    expect(
      choose(
        page,
        'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/94.0.4606.128 Safari/537.36 WebAppManager',
      ),
    ).toBeNull();
    expect(page.cookie).toBe('');
  });
});
