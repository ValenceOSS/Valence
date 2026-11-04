import { Button } from '@ValenceUI/Button';
import { FormField } from '@ValenceUI/FormField';
import { Link } from '@ValenceUI/Link';
import { addressOfId } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/addressOfId';
import type { CatalogueIdRowProps } from './CatalogueIdRow.types';
import { say } from '@ValenceI18n/say';

const MATCHED = /^(?:movie|tv):(\d+)$/u;

/**
 * A title's TMDB id on its Details tab, which only Fix match changes: the id, a link to the title
 * on TMDB, and Fix match beside it.
 *
 * @param subjectKey - The key the title's edits are kept under, which holds its TMDB id once matched.
 * @param isShow - Whether the title is a programme rather than a film.
 * @param onFixMatch - Opens Fix match, where it can be opened.
 * @param className - Extra classes for the caller's own layout.
 */
const CatalogueIdRow = ({ subjectKey, isShow, onFixMatch, className }: CatalogueIdRowProps) => {
  const id = MATCHED.exec(subjectKey)?.[1] ?? null;
  const address = id === null ? null : addressOfId('tmdb', id, isShow);
  const site = say('screens.adminArea.sourcedField.tmdb');

  return (
    <FormField label={site} {...(className === undefined ? {} : { className })}>
      <span className="flex h-8 items-center gap-3 text-sm">
        <span className={id === null ? 'text-text-muted' : 'tabular-nums text-text'}>
          {id ?? say('screens.adminArea.titleDetails.notMatchedYet')}
        </span>
        {address === null ? null : (
          <Link href={address} label={say('screens.adminArea.titleDetails.openOnSite', { site })}>
            {say('common.open')}
          </Link>
        )}
        {onFixMatch === undefined ? null : (
          <Button variant="secondary" size="sm" onClick={onFixMatch} className="ml-auto">
            {say('screens.adminArea.mediaTitlePage.fixMatch')}
          </Button>
        )}
      </span>
    </FormField>
  );
};

CatalogueIdRow.displayName = 'CatalogueIdRow';

export { CatalogueIdRow };
