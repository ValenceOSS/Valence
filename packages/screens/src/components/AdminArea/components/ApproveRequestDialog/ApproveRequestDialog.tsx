import { notify } from '@ValenceUI/notify';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import {
  approveMediaRequest,
  changeMediaRequest,
} from '@ValenceClient/requests/fetchMediaRequests';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { libraryKindOf } from '@ValenceContracts/functions/libraryKindOf';
import { ReleaseTypeChooser } from '@ValenceScreens/components/ReleaseTypeChooser/ReleaseTypeChooser';
import { SeasonChooser } from '@ValenceScreens/components/SeasonChooser/SeasonChooser';
import type { ReleaseType } from '@ValenceContracts/schemas/MediaRequest';
import type { ApproveRequestDialogProps } from './ApproveRequestDialog.types';
import { say } from '@ValenceI18n/say';

const THE_LIBRARYS = 'library';

/**
 * Approving a request, having looked it over first: which profile its releases are judged by,
 * which library it will be filed into, and — for a series or an artist — which seasons or which
 * kinds of record are watched for. Whatever was changed is saved before it is approved, so nothing
 * is fetched against the old answer.
 *
 * @param request - The request, or nothing while the dialog is closed.
 * @param onClose - Called when it is dismissed.
 * @param onApproved - Told once it is approved.
 */
const ApproveRequestDialog = ({ request, onClose, onApproved }: ApproveRequestDialogProps) => {
  const profiles = useQuery(requestsQueries.profiles());
  const libraries = useQuery(libraryQueries.all());
  const [profileId, setProfileId] = useState<string | null>(null);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<number[] | null>(null);
  const [releaseTypes, setReleaseTypes] = useState<ReleaseType[] | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);

  if (request !== null && request.id !== opened) {
    setOpened(request.id);
    setProfileId(request.profileId);
    setLibraryId(request.libraryId);
    setSeasons(request.seasons);
    setReleaseTypes(request.releaseTypes);
    setProblem(null);
  }

  const isMusic = request !== null && isMusicRequest(request.kind);

  const qualities = [
    { id: THE_LIBRARYS, label: say('admin.approveRequestDialog.librarysProfile') },
    ...(profiles.data ?? [])
      .filter((profile) => profile.kind === (isMusic ? 'music' : 'video'))
      .map((profile) => ({ id: profile.id, label: profile.name })),
  ];
  const quality = qualities.find((one) => one.id === (profileId ?? THE_LIBRARYS));

  const places =
    request === null
      ? []
      : (libraries.data ?? [])
          .filter((entry) => entry.kind === libraryKindOf(request.kind) && entry.takesRequests)
          .map((entry) => ({ id: entry.id, label: entry.name }));
  const place = places.find((one) => one.id === libraryId);

  const title =
    request === null
      ? say('admin.approveRequestDialog.titleUnnamed')
      : say('admin.approveRequestDialog.title', { title: request.title });

  const approve = () => {
    if (request === null) {
      return;
    }

    const changed = {
      ...(profileId === request.profileId ? {} : { profileId }),
      ...(libraryId === request.libraryId || libraryId === null ? {} : { libraryId }),
      ...(seasons === request.seasons ? {} : { seasons }),
      ...(releaseTypes === request.releaseTypes || releaseTypes === null ? {} : { releaseTypes }),
    };

    setIsApproving(true);
    setProblem(null);

    void (
      Object.keys(changed).length === 0
        ? Promise.resolve({ refusal: null })
        : changeMediaRequest(request.id, changed)
    )
      .then((changing) =>
        changing.refusal === null
          ? approveMediaRequest(request.id)
          : Promise.resolve({ value: null, refusal: changing.refusal }),
      )
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? say('admin.approveRequestDialog.couldNotApprove'));

          return;
        }

        notify.worked(say('admin.approveRequestDialog.approved', { title: request.title }));
        onApproved(value);
        onClose();
      })
      .finally(() => {
        setIsApproving(false);
      });
  };

  return (
    <DialogCompanion label={title} isOpen={request !== null} onClose={onClose}>
      <DialogTitle size="compact" title={title} detail={say('admin.approveRequestDialog.detail')} />

      <DialogContent className="flex flex-col gap-4">
        <FormField
          label={say('admin.approveRequestDialog.quality')}
          description={say('admin.approveRequestDialog.qualityDescription')}
        >
          <OptionMenu
            label={say('admin.approveRequestDialog.quality')}
            triggerShape="field"
            matchTriggerWidth
            groups={[
              {
                name: say('admin.approveRequestDialog.quality'),
                selectedId: profileId ?? THE_LIBRARYS,
                onSelect: (next) => {
                  setProfileId(next === THE_LIBRARYS ? null : next);
                },
                options: qualities,
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {quality?.label ?? say('admin.approveRequestDialog.librarysProfile')}
                </span>
                <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
              </>
            }
          />
        </FormField>

        {places.length < 2 ? null : (
          <FormField
            label={say('admin.approveRequestDialog.library')}
            description={say('admin.approveRequestDialog.libraryDescription')}
          >
            <OptionMenu
              label={say('admin.approveRequestDialog.library')}
              triggerShape="field"
              matchTriggerWidth
              groups={[
                {
                  name: say('admin.approveRequestDialog.library'),
                  selectedId: libraryId ?? '',
                  onSelect: setLibraryId,
                  options: places,
                },
              ]}
              trigger={
                <>
                  <span className="truncate">
                    {place?.label ?? say('admin.approveRequestDialog.chooseLibrary')}
                  </span>
                  <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
                </>
              }
            />
          </FormField>
        )}

        {request?.kind !== 'artist' ? null : (
          <ReleaseTypeChooser value={releaseTypes ?? ['album']} onChange={setReleaseTypes} />
        )}

        {request?.kind !== 'series' || request.tmdbId === null ? null : (
          <SeasonChooser tmdbId={request.tmdbId} seasons={seasons} onChange={setSeasons} />
        )}
      </DialogContent>

      <DialogFooter
        note={problem}
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('admin.approveRequestDialog.approve'),
          onChoose: approve,
          isLoading: isApproving,
        }}
      />
    </DialogCompanion>
  );
};

ApproveRequestDialog.displayName = 'ApproveRequestDialog';

export { ApproveRequestDialog };
