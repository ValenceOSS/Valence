import {
  CircleCheck as CircleCheckIcon,
  CircleX as CircleXIcon,
  Download as DownloadIcon,
} from '@keyline-icons/react/fill';
import { buttonStyles } from '@ValenceUI/Button/buttonStyles';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { PageHero } from '@ValenceUI/PageHero';
import { cn } from '@ValenceUI/cn';
import { BrandSection } from '@ValenceLanding/components/BrandPage/components/BrandSection/BrandSection';
import { WallpaperCard } from '@ValenceLanding/components/BrandPage/components/WallpaperCard/WallpaperCard';
import { BRAND_COLOURS } from '@ValenceLanding/tokens/BRAND_COLOURS';

const SAVE = cn(buttonStyles({ variant: 'confirm', size: 'lg' }), 'gap-2 no-underline');

const SAVE_QUIETLY = cn(buttonStyles({ variant: 'overlay', size: 'lg' }), 'gap-2 no-underline');

const TILE = 'rounded-[1.15rem] bg-[var(--frame-card)]';

const TRAY =
  'grid gap-1.5 rounded-[1.6rem] border border-[var(--surface-line)] bg-[var(--frame-panel)] p-1.5';

const LOCKUPS = [
  {
    src: '/brand/previews/lockup-horizontal-white.webp',
    ground: BRAND_COLOURS.night.hex,
    name: 'White, on dark',
    use: 'For dark backgrounds.',
  },
  {
    src: '/brand/previews/lockup-horizontal-ink.webp',
    ground: BRAND_COLOURS.paper.hex,
    name: 'Ink, on light',
    use: 'For light backgrounds.',
  },
] as const;

const RULES = [
  {
    name: 'Clear space',
    rule: 'Leave space around the logo of at least half the mark’s height. Keep text and other graphics out of it.',
  },
  {
    name: 'Smallest size',
    rule: 'The mark alone: 16px tall. The mark with the wordmark: 24px tall.',
  },
  {
    name: 'Mark or lockup',
    rule: 'Use the mark alone where space is tight, such as an app icon or favicon. Use the full logo everywhere else.',
  },
] as const;

const DO = [
  'Use the files from the brand kit unchanged',
  'Use white on dark backgrounds and ink on light ones',
  'Centre the logo, or place it in a corner with clear space',
  'Darken busy backgrounds behind the logo so it stays readable',
  'Use the lit version on Valence gradients and wallpapers',
] as const;

const DO_NOT = [
  'Add glows, outlines, bevels or coloured shadows',
  'Use colours other than white, ink, black or lit',
  'Stretch, squash, skew, rotate or crop it',
  'Retype “Valence” or set it in another typeface',
  'Rearrange the mark and wordmark, or change the space between them',
] as const;

const TYPEFACES = [
  {
    name: 'Gilroy Semibold',
    role: 'Wordmark only',
    sample: 'Valence',
    face: 'font-semibold tracking-[-0.035em]',
    note: 'Gilroy is a licensed font, so the brand kit includes the wordmark as images rather than the font file.',
    isWordmark: true,
  },
  {
    name: 'Plus Jakarta Sans',
    role: 'Headings and interface',
    sample: 'Your films and programmes',
    face: 'font-sans font-semibold tracking-[-0.035em]',
    note: 'Semibold for headings, medium for buttons, menus and labels.',
    isWordmark: false,
  },
  {
    name: 'Manrope',
    role: 'Body text',
    sample: 'Yours to keep, in every room.',
    face: 'font-body',
    note: 'Regular weight for paragraphs and descriptions.',
    isWordmark: false,
  },
  {
    name: 'Instrument Serif Italic',
    role: 'Accent words',
    sample: 'every screen',
    face: 'font-accent italic',
    note: 'One word or short phrase in a heading, never a full line.',
    isWordmark: false,
  },
] as const;

const COLOURS = Object.values(BRAND_COLOURS);

const WALLPAPERS = [
  { id: 'signal', name: 'Signal', look: 'The home page’s ASCII background, in blue' },
  { id: 'grain', name: 'Grain', look: 'Blue fold gradient with heavy grain' },
  { id: 'ribbon', name: 'Ribbon', look: 'Blue gradient in thin ribbons' },
  { id: 'shards', name: 'Shards', look: 'Sharp orange folds' },
  { id: 'haze', name: 'Haze', look: 'Soft violet and pink' },
  { id: 'pixel', name: 'Pixel', look: 'Fold gradient drawn in ASCII' },
  { id: 'mono', name: 'Mono', look: 'Black and white with grain' },
  { id: 'tide', name: 'Tide', look: 'Wide teal ribbons' },
  { id: 'ember', name: 'Ember', look: 'Red ASCII rising from the bottom' },
  { id: 'violet', name: 'Violet', look: 'Violet ASCII band' },
] as const;

/**
 * Valence's brand on one page: the logo and the rules around where it goes, the typefaces and what
 * each is for, the colours, and the wallpapers, with the kit and every wallpaper ready to save.
 */
const BrandPage = () => (
  <>
    <PageHero
      eyebrow="Branding"
      lead="Valence brand guidelines"
      description="The logo, typefaces, colours and wallpapers, and the rules for using them."
      actions={
        <>
          <Link
            href="/brand/valence-brand-kit.zip"
            downloadAs="Valence Brand Kit.zip"
            look="bare"
            className={SAVE}
          >
            <Icon of={DownloadIcon} size={18} />
            Download the brand kit
          </Link>
          <Link href="#wallpapers" look="bare" className={SAVE_QUIETLY}>
            Wallpapers
          </Link>
        </>
      }
      aside={
        <div
          className="flex h-80 items-center justify-center rounded-[1.6rem] p-10 sm:h-96"
          style={{ background: BRAND_COLOURS.night.hex }}
        >
          <img
            src="/brand/previews/lockup-stacked-lit.webp"
            alt="The Valence logo"
            width={1200}
            height={768}
            className="w-3/4 max-w-sm"
          />
        </div>
      }
    />

    <BrandSection
      title="Logo"
      text="The mark with the Gilroy wordmark, horizontal or stacked. The brand kit has white, ink, black and lit versions as PNG, and the mark alone as SVG."
    >
      <ul className={cn(TRAY, 'sm:grid-cols-2')}>
        {LOCKUPS.map((lockup) => (
          <li key={lockup.name} className={cn(TILE, 'flex flex-col overflow-hidden')}>
            <div
              className="flex aspect-[16/9] items-center justify-center p-10"
              style={{ background: lockup.ground }}
            >
              <img src={lockup.src} alt="" width={1200} height={317} className="w-3/4" />
            </div>
            <div className="flex flex-col gap-1 p-5">
              <h3 className="text-base font-semibold text-text">{lockup.name}</h3>
              <p className="text-sm text-text-muted">{lockup.use}</p>
            </div>
          </li>
        ))}
      </ul>

      <ul className={cn(TRAY, 'md:grid-cols-3')}>
        {RULES.map((rule) => (
          <li key={rule.name} className={cn(TILE, 'flex flex-col gap-2 p-6')}>
            <h3 className="text-base font-semibold text-text">{rule.name}</h3>
            <p className="text-sm leading-relaxed text-text-muted">{rule.rule}</p>
          </li>
        ))}
      </ul>
    </BrandSection>

    <BrandSection title="Placement" text="Where the logo can go, and what not to do with it.">
      <div className={cn(TRAY, 'md:grid-cols-2')}>
        {[
          { heading: 'Do', items: DO, mark: CircleCheckIcon, tone: 'success' as const },
          { heading: 'Don’t', items: DO_NOT, mark: CircleXIcon, tone: 'danger' as const },
        ].map((list) => (
          <div key={list.heading} className={cn(TILE, 'flex flex-col gap-4 p-6')}>
            <h3 className="text-lg font-semibold text-text">{list.heading}</h3>
            <ul className="flex flex-col gap-3">
              {list.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-text-muted">
                  <Icon of={list.mark} size={18} tone={list.tone} className="mt-px shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </BrandSection>

    <BrandSection title="Typography" text="The typefaces Valence uses, and what each one is for.">
      <ul className={TRAY}>
        {TYPEFACES.map((typeface) => (
          <li
            key={typeface.name}
            className={cn(
              TILE,
              'grid gap-4 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center',
            )}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-text">{typeface.name}</h3>
              <p className="text-sm font-medium text-text">{typeface.role}</p>
              <p className="text-sm text-text-muted">{typeface.note}</p>
            </div>
            {typeface.isWordmark ? (
              <img
                src="/brand/previews/lockup-horizontal-white.webp"
                alt=""
                width={1200}
                height={317}
                className="w-full max-w-sm"
              />
            ) : (
              <p className={cn('truncate text-3xl text-text sm:text-4xl', typeface.face)}>
                {typeface.sample}
              </p>
            )}
          </li>
        ))}
      </ul>
    </BrandSection>

    <BrandSection
      title="Colour"
      text="The colours Valence uses, and where each one goes. Blue is for accents, not backgrounds."
    >
      <ul className={cn(TRAY, 'grid-cols-2 md:grid-cols-5')}>
        {COLOURS.map((colour) => (
          <li key={colour.name} className={cn(TILE, 'flex flex-col overflow-hidden')}>
            <div
              className="aspect-[4/3] border-b border-[var(--surface-line)]"
              style={{ background: colour.hex }}
            />
            <div className="flex flex-col gap-1 p-4">
              <h3 className="text-sm font-semibold text-text">{colour.name}</h3>
              <p className="font-mono text-xs text-text-muted">{colour.hex}</p>
              <p className="text-xs text-text-muted">{colour.use}</p>
            </div>
          </li>
        ))}
      </ul>
    </BrandSection>

    <BrandSection
      id="wallpapers"
      title="Wallpapers"
      text="Ten wallpapers at 4K, for desktop (3840 × 2160) and phone (2160 × 3840)."
      actions={
        <>
          <Link
            href="/brand/valence-wallpapers-desktop.zip"
            downloadAs="Valence Wallpapers - Desktop.zip"
            look="bare"
            className={SAVE}
          >
            <Icon of={DownloadIcon} size={18} />
            Desktop pack
          </Link>
          <Link
            href="/brand/valence-wallpapers-phone.zip"
            downloadAs="Valence Wallpapers - Phone.zip"
            look="bare"
            className={SAVE_QUIETLY}
          >
            <Icon of={DownloadIcon} size={18} />
            Phone pack
          </Link>
        </>
      }
    >
      <ul className={cn(TRAY, 'sm:grid-cols-2 lg:grid-cols-3')}>
        {WALLPAPERS.map((wallpaper) => (
          <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} />
        ))}
      </ul>
    </BrandSection>
  </>
);

BrandPage.displayName = 'BrandPage';

export { BrandPage };
