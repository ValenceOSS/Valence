const ICON = 'assets/valence-icon.icon';

const LOGO = 'assets/valence-logo.svg';

const MAC_ICON_MARGIN = 100;

const APP_ICON_LOGO_SHARE = 0.42;

const TOP_SHELF_LOGO_SHARE = 0.3;

const ANDROID_ICON_LOGO_SHARE = 0.4;

const ANDROID_FOREGROUND_LOGO_SHARE = 0.31;

type BannerLayers = 'both' | 'logo' | 'background';

type BrandOutput =
  | { kind: 'copy'; from: string; to: string }
  | { kind: 'mark'; from: string; to: string; width: number; height: number }
  | { kind: 'icon'; from: string; to: string; pixels: number; margin: number }
  | {
      kind: 'banner';
      from: string;
      to: string;
      width: number;
      height: number;
      logoShare: number;
      layers: BannerLayers;
    };

/**
 * Lists every picture of the Valence icon and logo that the apps carry, and how each is made from
 * the two sources in `design`: the Icon Composer bundle and the logo drawn in white.
 *
 * The web, desktop, docs and landing pages each serve the logo themselves, so each gets a copy, and
 * the web, docs and landing pages a small render of the icon for the browser's tab, as does the
 * README. The phone and television tint the logo from a picture, so they get it drawn at the sizes
 * they use. The iPhone's icon reads the bundle straight from `design`; the desktop build takes a copy
 * of it for the Mac, and a flat render for Windows, Linux and the dock while it is being worked on,
 * with the margin a Mac icon leaves around itself. Apple TV and Android cannot take an Icon Composer
 * bundle, so their icons are cut from renders of it: Apple TV's icons and top shelf whole, and
 * Android's adaptive icon as the logo and the background apart, for the launcher to lay together.
 *
 * @returns What to make, from what, and where it goes, relative to the repository.
 */
const planBrandOutputs = (): BrandOutput[] => {
  const banner = (
    to: string,
    width: number,
    height: number,
    logoShare: number,
    layers: BannerLayers = 'both',
  ): BrandOutput => ({ kind: 'banner', from: ICON, to, width, height, logoShare, layers });
  const tv = (name: string, width: number, height: number, logoShare: number): BrandOutput =>
    banner(`apps/tv/assets/tv-icons/${name}.png`, width, height, logoShare);
  const mark = (to: string, width: number, height: number): BrandOutput => ({
    kind: 'mark',
    from: LOGO,
    to,
    width,
    height,
  });

  return [
    ...['web', 'desktop', 'docs', 'landing'].map((app): BrandOutput => ({
      kind: 'copy',
      from: LOGO,
      to: `apps/${app}/public/valence-logo.svg`,
    })),
    ...['web', 'docs', 'landing'].map((app): BrandOutput => ({
      kind: 'icon',
      from: ICON,
      to: `apps/${app}/public/icon.png`,
      pixels: 256,
      margin: 0,
    })),
    { kind: 'icon', from: ICON, to: 'assets/valence-icon.png', pixels: 256, margin: 0 },
    { kind: 'copy', from: ICON, to: 'apps/desktop/build/icon.icon' },
    { kind: 'icon', from: ICON, to: 'apps/desktop/build/icon.png', pixels: 1024, margin: 0 },
    {
      kind: 'icon',
      from: ICON,
      to: 'apps/desktop/build/icon-dev.png',
      pixels: 1024,
      margin: MAC_ICON_MARGIN,
    },
    mark('apps/mobile/src/assets/valence-mark.png', 38, 28),
    mark('apps/mobile/src/assets/valence-mark@2x.png', 76, 56),
    mark('apps/mobile/src/assets/valence-mark@3x.png', 114, 84),
    mark('apps/tv/src/assets/valence-mark.png', 1248, 916),
    mark('apps/tv/assets/launch/launch-mark.png', 160, 117),
    mark('apps/tv/assets/launch/launch-mark@2x.png', 320, 234),
    tv('icon', 1280, 768, APP_ICON_LOGO_SHARE),
    tv('iconSmall', 400, 240, APP_ICON_LOGO_SHARE),
    tv('iconSmall2x', 800, 480, APP_ICON_LOGO_SHARE),
    tv('topShelf', 1920, 720, TOP_SHELF_LOGO_SHARE),
    tv('topShelf2x', 3840, 1440, TOP_SHELF_LOGO_SHARE),
    tv('topShelfWide', 2320, 720, TOP_SHELF_LOGO_SHARE),
    tv('topShelfWide2x', 4640, 1440, TOP_SHELF_LOGO_SHARE),
    banner('apps/mobile/assets/icon/android-icon.png', 1024, 1024, ANDROID_ICON_LOGO_SHARE),
    banner(
      'apps/mobile/assets/icon/android-icon-foreground.png',
      1024,
      1024,
      ANDROID_FOREGROUND_LOGO_SHARE,
      'logo',
    ),
    banner('apps/mobile/assets/icon/android-icon-background.png', 1024, 1024, 0, 'background'),
  ];
};

export type { BannerLayers, BrandOutput };

export { planBrandOutputs };
