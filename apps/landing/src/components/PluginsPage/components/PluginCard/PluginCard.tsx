import { IconArrowUpRight, IconCheck, IconPuzzle } from '@tabler/icons-react';
import { Badge } from '@ValenceUI/Badge';
import { RevealItem } from '@ValenceUI/RevealItem';
import { describePermission } from '@ValenceLanding/content/plugins/describePermission';
import type { PluginCardProps } from './PluginCard.types';

const KIND_LABELS = { extension: 'Extension', theme: 'Theme' } as const;

/**
 * One official plugin: its icon, name and what it does, who made it and which version is current,
 * and, in plain words, everything it asks to be allowed to do, with a way to its source.
 *
 * @param plugin - The plugin's catalogue entry.
 * @param index - Where it sits in the grid, so it arrives in order.
 */
const PluginCard = ({ plugin, index }: PluginCardProps) => (
  <RevealItem
    index={index}
    className="flex list-none flex-col gap-5 rounded-2xl border border-border/60 bg-surface-raised/60 p-6"
  >
    <div className="flex items-start gap-4">
      {plugin.iconUrl === undefined ? (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <IconPuzzle size={22} aria-hidden />
        </span>
      ) : (
        <img
          src={plugin.iconUrl}
          alt=""
          className="size-12 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      )}

      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-lg font-semibold text-text">{plugin.name}</h2>
        <p className="text-sm text-text-muted">
          By {plugin.author}, version {plugin.version}
        </p>
      </div>
    </div>

    <p className="text-sm leading-relaxed text-text-muted">{plugin.description}</p>

    <div className="flex flex-wrap gap-2">
      {plugin.kinds.map((kind) => (
        <Badge key={kind} tone="outline">
          {KIND_LABELS[kind]}
        </Badge>
      ))}
    </div>

    {plugin.permissions.length === 0 ? (
      <p className="text-sm text-text-muted">Asks for no permissions.</p>
    ) : (
      <ul aria-label={`What ${plugin.name} may do`} className="flex flex-col gap-2">
        {plugin.permissions.map((permission) => (
          <li key={permission.kind} className="flex items-start gap-2 text-sm text-text-muted">
            <IconCheck size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            {describePermission(permission)}
          </li>
        ))}
      </ul>
    )}

    <a
      href={plugin.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-auto inline-flex items-center gap-1 self-start text-sm font-semibold text-accent underline-offset-4 hover:underline"
    >
      Read the source
      <IconArrowUpRight size={14} aria-hidden />
    </a>
  </RevealItem>
);

PluginCard.displayName = 'PluginCard';

export { PluginCard };
