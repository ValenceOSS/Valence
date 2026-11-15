import {
  CircleCheck as CircleCheckIcon,
  CircleX as CircleXIcon,
  Download as DownloadIcon,
} from '@keyline-icons/react/fill';
import { buttonStyles } from '@ValenceUI/Button/buttonStyles';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { LandingPageHero } from '@ValenceLanding/components/LandingPageHero/LandingPageHero';
import { cn } from '@ValenceUI/cn';
import { Logo } from '@ValenceUI/Logo';
import { StackingMark } from '@ValenceUI/StackingMark';
import { BrandSection } from '@ValenceLanding/components/BrandPage/components/BrandSection/BrandSection';
import { Lockup } from '@ValenceLanding/components/BrandPage/components/Lockup/Lockup';
import { MarkLayers } from '@ValenceLanding/components/BrandPage/components/MarkLayers/MarkLayers';
import { BRAND_COLOURS } from '@ValenceLanding/tokens/BRAND_COLOURS';

const SAVE = cn(buttonStyles({ variant: 'confirm', size: 'lg' }), 'gap-2 no-underline');

const TILE = 'rounded-[1.15rem] bg-[var(--frame-card)]';

const TRAY =
  'grid gap-1.5 rounded-[1.6rem] border border-[var(--surface-line)] bg-[var(--frame-panel)] p-1.5';

const { blue, ink, black, paper, white } = BRAND_COLOURS;

const LAYERS = [
  {
    lit: 'top',
    name: 'The request system',
    text: 'The top layer is Valence’s request system: ask for a film, a show or an album, and it arrives at the top of the stack.',
  },
  {
    lit: 'middle',
    name: 'Your media',
    text: 'The middle layer is your media: films, shows, music and books, fetched and ready to play. Its V points down, towards home.',
  },
  {
    lit: 'base',
    name: 'Your own hardware',
    text: 'The base is the hardware it all runs on, in your own home: the heaviest shape, flat underneath, with everything else resting on it.',
  },
] as const;

const LOCKUPS = [
  {
    ground: blue.hex,
    mark: white.hex,
    word: white.hex,
    name: 'White, on Valence Blue',
    use: 'The primary lockup.',
  },
  {
    ground: black.hex,
    mark: blue.hex,
    word: white.hex,
    name: 'Blue mark, on black',
    use: 'For televisions and dark screens.',
  },
  {
    ground: paper.hex,
    mark: ink.hex,
    word: ink.hex,
    name: 'Ink, on paper',
    use: 'For print and light grounds.',
  },
  {
    ground: white.hex,
    mark: blue.hex,
    word: ink.hex,
    name: 'Blue mark, on white',
    use: 'For documents and the web.',
  },
] as const;

const RULES = [
  {
    name: 'Never taller than the V',
    rule: 'Beside the name, the mark stands on the baseline and stops at the top of the V. The gap between them is a quarter of the type size.',
  },
  {
    name: 'Clear space',
    rule: 'Keep at least one layer’s height clear on every side of the mark, and keep text and other graphics out of it.',
  },
  {
    name: 'Smallest size',
    rule: 'The mark alone: 16px tall. The mark with the name: 12px cap height.',
  },
] as const;

const ICONS = [
  { ground: blue.hex, mark: white.hex, name: 'Blue' },
  { ground: black.hex, mark: blue.hex, name: 'Black' },
  { ground: white.hex, mark: blue.hex, name: 'White' },
  { ground: paper.hex, mark: ink.hex, name: 'Paper' },
  { ground: ink.hex, mark: paper.hex, name: 'Ink' },
] as const;

const SAVE_QUIET = cn(buttonStyles({ variant: 'secondary', size: 'lg' }), 'gap-2 no-underline');

const DO = [
  'Use the mark in one colour: white, ink, blue or black',
  'Set the mark at the height of the V, on the baseline',
  'Crop the mark large off the edge of a poster or background',
  'Put the blue mark on black for televisions and dark screens',
  'Darken busy backgrounds behind the logo so it stays readable',
] as const;

const DO_NOT = [
  'Make the mark taller than the V beside it',
  'Use orange anywhere outside a development server',
  'Rotate, stretch, outline or add a gradient to the mark',
  'Pull the layers apart or change the gaps between them',
  'Type “Valence” in another typeface beside the mark',
] as const;

const TYPEFACES = [
  {
    name: 'Plus Jakarta Sans ExtraBold',
    role: 'Wordmark and display',
    sample: 'Valence',
    face: 'font-sans font-[800] tracking-[-0.045em]',
    note: 'The name and large headlines, at weight 800 with the letters drawn 4.5% closer.',
  },
  {
    name: 'Plus Jakarta Sans',
    role: 'Headings, interface and this site',
    sample: 'Your films and shows',
    face: 'font-sans font-semibold tracking-[-0.03em]',
    note: 'Semibold for headings, medium for buttons and labels. The marketing site sets its body text in it too.',
  },
  {
    name: 'Manrope',
    role: 'Body text in the apps',
    sample: 'Yours to keep, in every room.',
    face: 'font-[Manrope]',
    note: 'Regular weight for paragraphs and descriptions inside Valence itself.',
  },
  {
    name: 'Instrument Serif Italic',
    role: 'Accent words',
    sample: 'every screen',
    face: 'font-accent italic',
    note: 'One word or short phrase in a heading, never a full line.',
  },
] as const;

const COLOURS = Object.values(BRAND_COLOURS);

/**
 * Valence's brand on one page: what the layered mark means and what each layer stands for, the
 * lockups and the rule that holds them together, the mark in motion, the app icon in every
 * colourway, what not to do, the typefaces and the colours, with the brand kit ready to save.
 */
const BrandPage = () => (
  <>
    <LandingPageHero
      eyebrow="Branding"
      lead="Valence brand guidelines"
      description="The mark, the name, the colours and the type, and the rules for using them. The kit has every logo in SVG, PNG and PDF, the app icons, a sticker pack and A4 posters."
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
          <Link
            href="/valence-logo.svg"
            downloadAs="Valence Mark.svg"
            look="bare"
            className={SAVE_QUIET}
          >
            Just the mark
          </Link>
        </>
      }
    />

    <BrandSection
      title="The mark"
      text="A library that grows one layer at a time. Valence takes what you ask for, brings it home and keeps it, and the mark draws that journey as three layers settling into one stack. Every layer is cut with a V, so the stack reads as the letter and as a direction: things flow in, towards home. The corners are soft because this is software people run in their own homes."
    >
      <ul className={cn(TRAY, 'md:grid-cols-3')}>
        {LAYERS.map((layer, at) => (
          <li key={layer.lit} className={cn(TILE, 'flex flex-col overflow-hidden')}>
            <div className="flex aspect-[16/10] items-center justify-center bg-surface text-text">
              <MarkLayers lit={layer.lit} className="h-24" />
            </div>
            <div className="flex flex-col gap-1.5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
                {`0${(at + 1).toString()} · ${layer.lit}`}
              </p>
              <h3 className="text-lg font-semibold text-text">{layer.name}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{layer.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </BrandSection>

    <BrandSection
      title="Logo"
      text="The mark beside the name in Plus Jakarta Sans ExtraBold, in one of four pairings. The mark is never taller than the V it stands beside."
    >
      <ul className={cn(TRAY, 'sm:grid-cols-2')}>
        {LOCKUPS.map((lockup) => (
          <li key={lockup.name} className={cn(TILE, 'flex flex-col overflow-hidden')}>
            <div
              className="flex aspect-[16/9] items-center justify-center p-10"
              style={{ background: lockup.ground }}
            >
              <Lockup
                markColour={lockup.mark}
                wordColour={lockup.word}
                className="text-5xl sm:text-6xl"
              />
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

    <BrandSection
      title="Motion"
      text="The layers drop in from the bottom up, each settling with a little give, and the name wipes in as the top layer lands. It opens this site once a visit, and loops on screens that wait. Everywhere else the mark holds still."
    >
      <ul className={cn(TRAY, 'sm:grid-cols-2')}>
        <li
          className={cn(TILE, 'flex aspect-[16/9] items-center justify-center')}
          style={{ background: blue.hex, color: white.hex }}
        >
          <StackingMark
            isLooping
            isCurrentColour
            label="The Valence mark, stacking"
            className="h-28"
          />
        </li>
        <li
          className={cn(TILE, 'flex aspect-[16/9] items-center justify-center')}
          style={{ background: black.hex, color: blue.hex }}
        >
          <span className="flex items-baseline gap-[0.24em] text-6xl font-[800] leading-none tracking-[-0.045em]">
            <StackingMark isLooping isCurrentColour className="h-[1cap]" />
            <span style={{ color: white.hex }}>Valence</span>
          </span>
        </li>
      </ul>
    </BrandSection>

    <BrandSection
      title="App icon"
      text="The mark alone, centred on a rounded square, in five colourways. Blue is the default; black with a blue mark is for dark home screens."
    >
      <ul className={cn(TRAY, 'grid-cols-2 sm:grid-cols-5')}>
        {ICONS.map((icon) => (
          <li key={icon.name} className={cn(TILE, 'flex flex-col items-center gap-4 p-6')}>
            <span
              className="grid aspect-square w-full max-w-28 place-items-center rounded-[23%] shadow-[var(--shadow-lifted)]"
              style={{ background: icon.ground, color: icon.mark }}
            >
              <Logo isCurrentColour className="w-[46%]" />
            </span>
            <h3 className="text-sm font-semibold text-text">{icon.name}</h3>
          </li>
        ))}
      </ul>
    </BrandSection>

    <BrandSection title="Placement" text="Where the mark can go, and what not to do with it.">
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
            <p className={cn('truncate text-3xl text-text sm:text-4xl', typeface.face)}>
              {typeface.sample}
            </p>
          </li>
        ))}
      </ul>
    </BrandSection>

    <BrandSection
      title="Colour"
      text="Blue leads and the neutrals carry it. Orange marks a development server, so one can never be mistaken for the real thing, and it never appears in the brand."
    >
      <ul className={cn(TRAY, 'grid-cols-2 md:grid-cols-6')}>
        {COLOURS.map((colour) => (
          <li key={colour.name} className={cn(TILE, 'group flex flex-col overflow-hidden')}>
            <div
              className="flex aspect-[4/3] items-center justify-center border-b border-[var(--surface-line)]"
              style={{ background: colour.hex, color: colour.mark }}
            >
              <Logo
                isCurrentColour
                className="h-[30%] scale-90 opacity-0 transition-[opacity,scale] duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 motion-reduce:scale-100"
              />
            </div>
            <div className="flex flex-col gap-1 p-4">
              <h3 className="text-sm font-semibold text-text">{colour.name}</h3>
              <p className="font-mono text-xs text-text-muted">{colour.hex}</p>
              <p className="text-xs text-text-muted">{colour.use}</p>
            </div>
          </li>
        ))}
      </ul>
    </BrandSection>
  </>
);

BrandPage.displayName = 'BrandPage';

export { BrandPage };
