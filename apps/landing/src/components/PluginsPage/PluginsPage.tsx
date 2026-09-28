import { motion } from 'motion/react';
import { IconArrowRight } from '@tabler/icons-react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { PluginCard } from '@ValenceLanding/components/PluginsPage/components/PluginCard/PluginCard';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { readCatalogue } from '@ValenceLanding/content/plugins/readCatalogue';
import type { PluginsPageProps } from './PluginsPage.types';
import rawCatalogue from 'virtual:plugin-catalogue';

const OFFICIAL = readCatalogue(rawCatalogue);

const DOC_LINK =
  'inline-flex items-center gap-1 text-sm font-semibold text-accent underline-offset-4 hover:underline';

const PROMISES = [
  {
    title: 'Runs on your server',
    text: 'A plugin runs in a sandbox of its own on the server. Nothing from it ever runs in your browser, your phone or your television.',
  },
  {
    title: 'Asks first',
    text: 'Every plugin says up front what it wants to reach, and you see that list before you install it. It can do nothing else.',
  },
  {
    title: 'Signed',
    text: 'Official plugins are signed, and Valence checks the signature before anything is installed. Anything unsigned comes with a clear warning.',
  },
] as const;

/**
 * The official plugins, as the signed catalogue lists them, with what keeps a plugin safe said
 * first and a way to start writing one of your own.
 *
 * @param plugins - The plugins to list, the official catalogue unless a test says otherwise.
 */
const PluginsPage = ({ plugins = OFFICIAL }: PluginsPageProps) => (
  <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-10">
    <header className="flex flex-col gap-3 pb-10">
      <h1 className="text-5xl font-semibold tracking-tight text-text sm:text-6xl">Plugins</h1>
      <p className="max-w-2xl text-lg text-text-muted">
        Add to Valence without handing a stranger the keys. Import your anime lists, bring your
        playlists across, give the app a new look.
      </p>
      <a href={`${DOCS_URL}/plugins/getting-started`} className={DOC_LINK}>
        Write your own
        <IconArrowRight size={14} aria-hidden />
      </a>
    </header>

    <ul className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-3">
      {PROMISES.map((promise) => (
        <li key={promise.title} className="flex flex-col gap-2 bg-surface p-6">
          <h2 className="text-base font-semibold text-text">{promise.title}</h2>
          <p className="text-sm leading-relaxed text-text-muted">{promise.text}</p>
        </li>
      ))}
    </ul>

    {plugins.length === 0 ? (
      <p className="mt-12 max-w-xl text-text-muted">
        The first official plugins are on their way. Until then, the documentation shows how to
        write one of your own.
      </p>
    ) : (
      <motion.ul
        initial="hidden"
        animate="shown"
        variants={groupVariants}
        aria-label="Official plugins"
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {plugins.map((plugin, index) => (
          <PluginCard key={plugin.id} plugin={plugin} index={index} />
        ))}
      </motion.ul>
    )}
  </div>
);

PluginsPage.displayName = 'PluginsPage';

export { PluginsPage };
