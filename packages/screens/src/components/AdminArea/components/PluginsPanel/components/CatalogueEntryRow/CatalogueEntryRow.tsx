import { Plug as PlugIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import type { CatalogueEntryRowProps } from './CatalogueEntryRow.types';
import { say } from '@ValenceI18n/say';

/**
 * One official plugin in the catalogue: what it does, whether it is a theme, whether this server can
 * run it, and a way to look it over before installing.
 *
 * @param entry - The plugin as the catalogue lists it.
 * @param isBusy - Whether it is being fetched.
 * @param onInstall - Told somebody wants to look at installing it.
 */
const CatalogueEntryRow = ({ entry, isBusy, onInstall }: CatalogueEntryRowProps) => {
  const isCurrent = entry.installedVersion === entry.version;

  return (
    <li className="flex items-start gap-3 px-4 py-4">
      {entry.iconUrl === null || !entry.iconUrl.startsWith('/api/') ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-text-muted">
          <Icon of={PlugIcon} size={18} />
        </span>
      ) : (
        <img src={entry.iconUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-text">{entry.name}</span>
          <span className="text-xs text-text-muted">{entry.version}</span>
          {entry.kinds.includes('theme') ? <Badge size="sm">{say('common.theme')}</Badge> : null}
        </div>

        <p className="text-xs leading-relaxed text-text-muted">{entry.description}</p>

        <p className="flex flex-wrap items-center gap-x-3 text-xs text-text-muted/80">
          <span>{say('common.byAuthor', { author: entry.author })}</span>
          <Link href={entry.sourceUrl}>{say('common.source')}</Link>
        </p>
      </div>

      {!entry.isCompatible ? (
        <Badge size="sm" tone="warning">
          {say('screens.pluginsPanel.catalogueEntryRow.needsANewerValence')}
        </Badge>
      ) : isCurrent ? (
        <Badge size="sm" tone="success">
          {say('screens.pluginsPanel.catalogueEntryRow.installed')}
        </Badge>
      ) : (
        <Button size="sm" variant="confirm" isLoading={isBusy} onClick={onInstall}>
          {entry.installedVersion === null
            ? say('common.install')
            : say('common.updateToVersion', { version: entry.version })}
        </Button>
      )}
    </li>
  );
};

CatalogueEntryRow.displayName = 'CatalogueEntryRow';

export { CatalogueEntryRow };
