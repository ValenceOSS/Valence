import { Button } from '@ValenceUI/Button';
import { FormField } from '@ValenceUI/FormField';
import { Link } from '@ValenceUI/Link';
import { TextField } from '@ValenceUI/TextField';
import { addressOfId } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/addressOfId';
import type { CatalogueIdRowProps } from './CatalogueIdRow.types';
import { say } from '@ValenceI18n/say';

const MATCHED = /^(?:movie|tv):(\d+)$/u;

/**
 * A title's TMDB id on its Details tab, which only Fix match changes: the id in a field that cannot
 * be typed in, a link to the title on TMDB beside it, and Fix match where other fields keep their
 * menu.
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
          <span className="ml-auto">
            <Button variant="ghost" size="xs" onClick={onFixMatch}>
              {say('screens.adminArea.mediaTitlePage.fixMatch')}
            </Button>
          </span>
        )
      }
    >
      <span className="flex items-center gap-3">
        <TextField
          label={site}
          isLabelHidden
          disabled
          value={id ?? say('screens.adminArea.titleDetails.notMatchedYet')}
          onValueChange={() => undefined}
          className="min-w-0 flex-1"
        />
        {address === null ? null : (
          <Link
            href={address}
            label={say('screens.adminArea.titleDetails.openOnSite', { site })}
            className="shrink-0 text-sm"
          >
            {say('common.open')}
          </Link>
        )}
      </span>
    </FormField>
  );
};

CatalogueIdRow.displayName = 'CatalogueIdRow';

export { CatalogueIdRow };
