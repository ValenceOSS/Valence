import { Button } from '@ValenceUI/Button';
import { FormField } from '@ValenceUI/FormField';
import { cn } from '@ValenceUI/cn';
import { OpenOnSite } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/components/OpenOnSite/OpenOnSite';
import { addressOfId } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/addressOfId';
import type { CatalogueIdRowProps } from './CatalogueIdRow.types';
import { say } from '@ValenceI18n/say';

const MATCHED = /^(?:movie|tv):(\d+)$/u;

/**
 * A title's TMDB id on its Details tab, which only Fix match changes: the id written plainly rather
 * than in a box, since it cannot be typed in, a link to the title on TMDB just after it, and Fix
 * match where other fields keep their menu.
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
    <FormField
      label={site}
      {...(className === undefined ? {} : { className })}
      aside={
        onFixMatch === undefined ? undefined : (
          <span className="ms-auto">
            <Button variant="ghost" size="xs" className="h-7" onClick={onFixMatch}>
              {say('screens.adminArea.mediaTitlePage.fixMatch')}
            </Button>
          </span>
        )
      }
    >
      <span
        className={cn(
          'flex h-8 items-center gap-1 text-[0.8125rem] tabular-nums',
          id === null ? 'text-text-muted' : 'text-text',
        )}
      >
        {id ?? say('screens.adminArea.titleDetails.notMatchedYet')}
        {address === null ? null : (
          <OpenOnSite
            href={address}
            label={say('screens.adminArea.titleDetails.openOnSite', { site })}
          />
        )}
      </span>
    </FormField>
  );
};

CatalogueIdRow.displayName = 'CatalogueIdRow';

export { CatalogueIdRow };
