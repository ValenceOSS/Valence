import { motion, useReducedMotionConfig } from 'motion/react';
import { IconChecklist, IconShieldLockFilled, IconSignature } from '@tabler/icons-react';
import { Button } from '@ValenceUI/Button';
import {
  revealItemVariants,
  revealTransition,
  revealVariants,
  staggerVariants,
} from '@ValenceUI/animations/reveal';
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
 * The official plugins, as the signed catalogue lists them: a short word on what plugins are with a
 * way to start writing one, the three promises that keep one safe, and then a card for each plugin
 * saying what it does and, in a few words, what it may reach.
 *
 * @param plugins - The plugins to list, the official catalogue unless a test says otherwise.
 */
const PluginsPage = ({ plugins = OFFICIAL }: PluginsPageProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-5 pb-24 pt-32 sm:px-10 sm:pt-36">
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          className="flex flex-col items-start gap-5"
        >
          <motion.h1
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'bouncy')}
            className="text-5xl font-semibold tracking-tight text-text sm:text-6xl"
          >
            Plugins
          </motion.h1>

          <motion.p
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'bouncy')}
            className="max-w-md text-lg text-text-muted"
          >
            Add to Valence without handing over the keys.
          </motion.p>

          <motion.div
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'bouncy')}
            className="flex flex-wrap items-center gap-3 pt-1"
          >
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
              variant="secondary"
              size="lg"
              onClick={() => {
                window.location.assign(`${DOCS_URL}/use/plugins`);
              }}
            >
              Read the plugin docs
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="shown"
          custom={1}
          variants={revealItemVariants(prefersReducedMotion)}
          className="group valence-surface valence-surface--flat relative h-80 overflow-hidden rounded-3xl p-6 sm:h-96"
        >
          <FeatureVisual kind="plugins" />
        </motion.div>
      </section>

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
              viewport={{ once: true, margin: '-60px' }}
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
            The official catalogue could not be read just now. The documentation shows how to write
            a plugin of your own in the meantime.
          </p>
        ) : (
          <ul aria-label="Official plugins" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plugins.map((plugin, index) => (
              <PluginCard key={plugin.id} plugin={plugin} index={index} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

PluginsPage.displayName = 'PluginsPage';

export { PluginsPage };
