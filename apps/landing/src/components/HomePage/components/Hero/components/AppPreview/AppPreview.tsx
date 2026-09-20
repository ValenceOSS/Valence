import { GlassPanel } from '@ValenceUI/GlassPanel';
import { cn } from '@ValenceUI/cn';

const SIDE_SHOT =
  'absolute top-10 hidden aspect-video w-[42%] rounded-xl border border-border/60 object-cover shadow-[var(--shadow-cast)] sm:block';

/**
 * The app itself, shown rather than described — a screenshot is worth more than another paragraph
 * of what it looks like. Browsing and admin flank the main view rather than crowding it, glimpsed
 * rather than explained.
 */
const AppPreview = () => (
  <div className="relative mx-auto flex w-full max-w-5xl items-start justify-center lg:max-w-6xl xl:max-w-7xl">
    <img
      src="/hero-3.jpeg"
      alt="The Valence server overview: processor, memory, storage and streaming at a glance"
      loading="eager"
      className={cn(SIDE_SHOT, 'left-0 -rotate-6')}
    />

    <img
      src="/hero-2.jpeg"
      alt="The Valence web app's home page, with continue-watching, picked-for-you and recently-added rails"
      loading="eager"
      className={cn(SIDE_SHOT, 'right-0 rotate-6')}
    />

    <GlassPanel
      elevation="floating"
      className="relative z-10 w-full max-w-2xl overflow-hidden lg:max-w-3xl xl:max-w-4xl"
    >
      <img
        src="/hero.jpeg"
        alt="The Valence web app open on a title's page, with the continue-watching rail beneath it"
        loading="eager"
        className="block w-full"
      />
    </GlassPanel>
  </div>
);

AppPreview.displayName = 'AppPreview';

export { AppPreview };
