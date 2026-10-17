import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { pickMediaRelease } from '@ValenceClient/requests/fetchMediaRequests';
import { releaseFromMagnet } from '@ValenceClient/requests/releaseFromMagnet';
import type { SearchScope } from '@ValenceContracts/schemas/MediaRequest';
import type { MagnetFormProps } from './MagnetForm.types';
import { say } from '@ValenceI18n/say';

/**
 * What a magnet link for a title is named before anybody says otherwise: the season or episode it
 * was opened for, written the way a release is, or the film and its year.
 *
 * @param title - The title.
 * @param year - Its year, for a film.
 * @param scope - The season or episode, or nothing for the whole title.
 * @returns The name.
 */
const namedFor = (title: string, year: number | null, scope: SearchScope | null): string => {
  if (scope === null) {
    return year === null ? title : `${title} ${year.toString()}`;
  }

  const season = `S${scope.season.toString().padStart(2, '0')}`;

  return scope.episode === null
    ? `${title} ${season}`
    : `${title} ${season}E${scope.episode.toString().padStart(2, '0')}`;
};

/**
 * Downloads a magnet link somebody pasted for a title, as though it were a release a search found:
 * named the way a release is, which says the episodes it fills, then sent to the download client and
 * filed into the title's library once it is done. The name starts as the one the link carries, or
 * the season or episode it was opened for.
 *
 * @param request - The title it is for.
 * @param scope - The season or episode it was opened for, or nothing for the whole title.
 * @param onPicked - Told the title once the link is on its way.
 */
const MagnetForm = ({ request, scope, onPicked }: MagnetFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [magnet, setMagnet] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const carried = releaseFromMagnet(magnet, '')?.title ?? null;
  const shown =
    name ??
    carried ??
    namedFor(request.title, request.kind === 'film' ? request.year : null, scope);

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="xs"
        className="self-start"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        {say('screens.adminArea.titlePage.magnetForm.addAMagnetLink')}
      </Button>
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-line p-4"
      onSubmit={(event) => {
        event.preventDefault();

        const release = releaseFromMagnet(magnet, shown);

        if (release === null) {
          setProblem(say('screens.adminArea.titlePage.magnetForm.thatIsNotAMagnetLink'));

          return;
        }

        setIsSending(true);
        setProblem(null);
        void pickMediaRelease(request.id, release, false)
          .then(({ value, refusal }) => {
            if (value === null) {
              setProblem(
                refusal?.message ??
                  say(
                    'screens.requestDetailDialog.requestReleasesTab.thatReleaseCouldNotBeFetched',
                  ),
              );

              return;
            }

            notify.worked(say('screens.adminArea.titlePage.magnetForm.downloadingTheMagnetLink'));
            onPicked(value);
          })
          .finally(() => {
            setIsSending(false);
          });
      }}
    >
      <TextField
        label={say('screens.adminArea.titlePage.magnetForm.magnetLink')}
        value={magnet}
        onValueChange={setMagnet}
        placeholder={say('screens.adminArea.titlePage.magnetForm.aMagnetLinkLooksLike')}
        hasFocusOnMount
        {...(problem === null ? {} : { error: problem })}
      />

      <TextField
        label={say('screens.adminArea.titlePage.magnetForm.whatItHolds')}
        description={say('screens.adminArea.titlePage.magnetForm.itsNameSaysWhichEpisodes')}
        value={shown}
        onValueChange={setName}
      />

      <Button
        type="submit"
        variant="secondary"
        size="sm"
        className="self-end"
        isLoading={isSending}
      >
        {say('screens.adminArea.titlePage.magnetForm.downloadIt')}
      </Button>
    </form>
  );
};

MagnetForm.displayName = 'MagnetForm';

export { MagnetForm };
