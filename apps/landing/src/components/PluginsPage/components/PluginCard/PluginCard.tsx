import { motion, useReducedMotionConfig } from 'motion/react';
import {
  IconBooks,
  IconDownloadFilled,
  IconEyeFilled,
  IconPlaylistFilled,
  IconPlusFilled,
  IconUserCircle,
} from '@tabler/icons-react';
import { Badge } from '@ValenceUI/Badge';
import { revealItemVariants } from '@ValenceUI/animations/reveal';
import { summarisePermissions } from '@ValenceLanding/content/plugins/summarisePermissions';
import { PluginDetails } from '@ValenceLanding/components/PluginsPage/components/PluginDetails/PluginDetails';
import { PluginMark } from '@ValenceLanding/components/PluginsPage/components/PluginMark/PluginMark';
import type { PermissionSummary } from '@ValenceLanding/content/plugins/PermissionSummary';
import type { PluginCardProps } from './PluginCard.types';

const KIND_LABELS = { extension: 'Extension', theme: 'Theme' } as const;

const SUMMARY_GLYPHS: Record<PermissionSummary['kind'], typeof IconBooks> = {
  account: IconUserCircle,
  library: IconBooks,
  viewing: IconEyeFilled,
  playlists: IconPlaylistFilled,
  requests: IconPlusFilled,
};

/**
 * One official plugin as a card: its mark, its name, what kind of plugin it is and which version is
 * current, a few lines on what it does, and in a handful of words what it may reach — with the exact
 * sites and every permission in full folded away beneath, and where to install it from.
 *
 * @param plugin - The plugin's catalogue entry.
 * @param index - Where it sits in the grid, so it arrives in order.
 */
const PluginCard = ({ plugin, index }: PluginCardProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const summaries = summarisePermissions(plugin.permissions);

  return (
    <motion.li
      custom={index}
      initial="hidden"
      whileInView="shown"
      animate="hidden"
      viewport={{ margin: '-60px' }}
      variants={revealItemVariants(prefersReducedMotion)}
      className="valence-surface valence-surface--flat flex h-full list-none flex-col gap-5 rounded-3xl p-6 sm:p-7"
    >
      <div className="flex items-start gap-4">
        <PluginMark plugin={plugin} size="lg" />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="text-lg font-semibold leading-tight text-text">{plugin.name}</h3>
          <p className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
            {plugin.kinds.map((kind) => (
              <Badge key={kind} size="sm">
                {KIND_LABELS[kind]}
              </Badge>
            ))}
            <span>
              {plugin.author} · v{plugin.version}
            </span>
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-text-muted">{plugin.description}</p>

      {summaries.length === 0 ? (
        <p className="text-sm text-text-muted">Touches none of your things.</p>
      ) : (
        <ul aria-label={`What ${plugin.name} may reach`} className="flex flex-wrap gap-2">
          {summaries.map((summary) => {
            const Glyph = SUMMARY_GLYPHS[summary.kind];

            return (
              <li
                key={summary.id}
                className="flex items-center gap-1.5 rounded-full border border-[var(--surface-line)] bg-[var(--surface-hover)] px-3 py-1 text-xs font-medium text-text"
              >
                <Glyph size={14} aria-hidden className="shrink-0 text-text-muted" />
                {summary.label}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-3 border-t border-[var(--surface-line)] pt-4">
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <IconDownloadFilled size={16} aria-hidden className="shrink-0" />
          Install from Admin › Plugins
        </p>

        <PluginDetails plugin={plugin} />
      </div>
    </motion.li>
  );
};

PluginCard.displayName = 'PluginCard';

export { PluginCard };
