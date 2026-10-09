import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { RequestReleasesTab } from '@ValenceScreens/components/AdminArea/components/TitlePage/components/RequestReleasesTab/RequestReleasesTab';
import { nameSearchScope } from '@ValenceClient/requests/nameSearchScope';
import type { InteractiveSearchDialogProps } from './InteractiveSearchDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Interactive search for a title: every release the indexers have for it, judged and best first,
 * refused ones with why, and any one of them to fetch in place of whatever is downloading.
 *
 * @param request - The title's request, or nothing while the dialog is closed.
 * @param scope - The season, in its packs, or the episode to search for, or nothing for all of it.
 * @param onClose - Told when it was dismissed.
 * @param onPicked - Told the request once a release picked is on its way.
 */
const InteractiveSearchDialog = ({
  request,
  scope = null,
  onClose,
  onPicked,
}: InteractiveSearchDialogProps) => {
  const title =
    request === null
      ? say('screens.adminArea.titlePage.interactiveSearch')
      : scope === null
        ? say('screens.adminArea.titlePage.interactiveSearchDialog.interactiveSearchForTitle', {
            title: request.title,
          })
        : say(
            'screens.adminArea.titlePage.interactiveSearchDialog.interactiveSearchForTitleScope',
            {
              title: request.title,
              scope: nameSearchScope(scope),
            },
          );

  return (
    <DialogCompanion label={title} isOpen={request !== null} onClose={onClose} size="stage">
      <DialogTitle
        size="compact"
        title={title}
        detail={
          scope !== null && scope.episode === null
            ? say('screens.adminArea.titlePage.interactiveSearchDialog.onlyWholeSeasonReleases')
            : say('screens.adminArea.titlePage.interactiveSearchDialog.pickingOneReplaces')
        }
      />

      <DialogContent className="flex min-h-0 flex-1 flex-col">
        {request === null ? null : (
          <RequestReleasesTab
            request={request}
            scope={scope}
            onPicked={(picked) => {
              onPicked(picked);
              onClose();
            }}
          />
        )}
      </DialogContent>
    </DialogCompanion>
  );
};

InteractiveSearchDialog.displayName = 'InteractiveSearchDialog';

export { InteractiveSearchDialog };
