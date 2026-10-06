import { motion, useReducedMotionConfig } from 'motion/react';
import { IconChecklist, IconShieldLockFilled, IconSignature } from '@tabler/icons-react';
import { Button } from '@ValenceUI/Button';
import { revealItemVariants } from '@ValenceUI/animations/reveal';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';
import { PageHero } from '@ValenceLanding/components/PageHero/PageHero';
import { SectionCard } from '@ValenceLanding/components/SectionCard/SectionCard';
import { FeatureVisual } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/FeatureVisual';
import { PluginCard } from '@ValenceLanding/components/PluginsPage/components/PluginCard/PluginCard';
import { PromiseCard } from '@ValenceLanding/components/PluginsPage/components/PromiseCard/PromiseCard';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { readCatalogue } from '@ValenceLanding/content/plugins/readCatalogue';
import type { PluginsPageProps } from './PluginsPage.types';
import rawCatalogue from 'virtual:plugin-catalogue';

const OFFICIAL = readCatalogue(rawCatalogue);

const PROMISES = [
  {
    title: 'Runs on your server',
    text: 'Sandboxed on the server. Never in your browser, phone or TV.',
    glyph: IconShieldLockFilled,
  },
  {
    title: 'Asks first',
    text: 'You see everything it wants to reach before it is installed.',
    glyph: IconChecklist,
  },
  {
    title: 'Signed',
    text: 'Official plugins are signed and checked. Anything else is flagged.',
    glyph: IconSignature,
  },
] as const;

const SECTION_TITLE = 'text-2xl font-semibold tracking-tight text-text';

/**
 * The official plugins, as the signed catalogue lists them: an opening card with a short word on
 * what plugins are, a way to start writing one and one asking for what it may reach, then on a card
 * beneath it the three promises that keep one safe and a card for each plugin saying what it does
 * and, in a few words, what it may reach, and last the way to get started.
 *
 * @param plugins - The plugins to list, the official catalogue unless a test says otherwise.
 */
const PluginsPage = ({ plugins = OFFICIAL }: PluginsPageProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <>
      <PageHero
        eyebrow="Plugins"
        lead="Add to Valence without handing over"
        accent="the keys"
        description="Plugins run in a sandbox on your server and reach only what you allowed when you installed them."
        actions={
          <>
            <Button
              variant="confirm"
              size="lg"
              onClick={() => {
                window.location.assign(`${DOCS_URL}/plugins/getting-started`);
              }}
            >
              Write your own
            </Button>
            <Button
              variant="overlay"
              size="lg"
              onClick={() => {
                window.location.assign(`${DOCS_URL}/use/plugins`);
              }}
            >
              Read the plugin docs
            </Button>
          </>
        }
        aside={
          <div className="valence-glass valence-glass--film relative h-80 overflow-hidden rounded-[1.6rem] p-2 sm:h-96">
            <div className="h-full overflow-hidden rounded-[1.2rem] bg-surface">
              <FeatureVisual kind="plugins" />
            </div>
          </div>
        }
      />

      <SectionCard>
        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-5 py-16 sm:px-10 sm:py-20 xl:max-w-7xl">
          <section aria-labelledby="plugin-promises" className="flex flex-col gap-5">
            <h2 id="plugin-promises" className="sr-only">
              What keeps a plugin safe
            </h2>

            <ul className="grid gap-4 sm:grid-cols-3">
              {PROMISES.map((promise, index) => (
                <motion.li
                  key={promise.title}
                  custom={index}
                  initial="hidden"
                  whileInView="shown"
                  animate="hidden"
                  viewport={{ margin: '-60px' }}
                  variants={revealItemVariants(prefersReducedMotion)}
                  className="list-none"
                >
                  <PromiseCard title={promise.title} text={promise.text} glyph={promise.glyph} />
                </motion.li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="official-plugins" className="flex flex-col gap-6">
            <h2 id="official-plugins" className={SECTION_TITLE}>
              Official plugins
              {plugins.length === 0 ? null : (
                <span className="ml-2 text-base font-normal text-text-muted">
                  {plugins.length.toString()}
                </span>
              )}
            </h2>

            {plugins.length === 0 ? (
              <p className="max-w-xl text-text-muted">
                The official catalogue could not be read just now. The documentation shows how to
                write a plugin of your own in the meantime.
              </p>
            ) : (
              <ul
                aria-label="Official plugins"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {plugins.map((plugin, index) => (
                  <PluginCard key={plugin.id} plugin={plugin} index={index} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </SectionCard>

      <GetStarted />
    </>
  );
};

PluginsPage.displayName = 'PluginsPage';

export { PluginsPage };
