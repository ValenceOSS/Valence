import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { notify } from '@ValenceUI/notify';
import { useState } from 'react';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { Form } from '@ValenceUI/Form';
import { downloadClientFormSchema } from './downloadClientFormSchema';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import {
  addDownloadClient,
  changeDownloadClient,
  tryDownloadClient,
} from '@ValenceClient/requests/fetchDownloadClients';
import { LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import { TryItButton } from '@ValenceScreens/components/AdminArea/components/TryItButton/TryItButton';
import { CLIENT_KINDS, choosingKind, formFor } from './readDownloadClientForm';
import type { TryVerdict } from '@ValenceScreens/components/AdminArea/components/TryItButton/TryItButton.types';
import type { DownloadClientForm } from './readDownloadClientForm';
import type { DownloadClientDialogProps } from './DownloadClientDialog.types';
import { say } from '@ValenceI18n/say';

const DOWNLOAD_CLIENT_FORM_KEYS = [
  'kind',
  'name',
  'url',
  'username',
  'password',
  'apiKey',
  'categories',
  'remotePath',
  'localPath',
  'priority',
  'isEnabled',
] as const;

/**
 * Adds a download client, or changes one already kept: where it is, how to log in to it, and a
 * category — a label, in Transmission — for each kind of library, which marks what Valence sent and
 * what it is for, so nothing else in the client is ever listed or touched and each kind can be given
 * a folder of its own there, as Sonarr and Radarr each have theirs.
 *
 * It can be tried before it is saved. A password or key is never shown back; leaving one empty when
 * changing a client keeps the one it has.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param client - The client being changed, or null to add one.
 * @param onClose - Called when it is dismissed.
 * @param onSaved - Called with the client as kept.
 */
const DownloadClientDialog = ({ isOpen, client, onClose, onSaved }: DownloadClientDialogProps) => {
  const [shownFor, setShownFor] = useState(client);
  const [problem, setProblem] = useState<string | null>(null);
  const [isTrying, setIsTrying] = useState(false);
  const [verdict, setVerdict] = useState<TryVerdict>(null);
  const [version, setVersion] = useState<string | null>(null);

  const form = useZodForm(downloadClientFormSchema, formFor(client), async (draft) => {
    const { value, refusal } = await (client === null
      ? addDownloadClient(draft)
      : changeDownloadClient(client.id, draft));

    if (value === null) {
      return refusal?.message ?? say('common.thatCouldNotBeSaved');
    }

    notify.worked(
      client === null
        ? say('common.addedName', { name: value.name })
        : say('common.savedName', { name: value.name }),
    );
    onSaved(value);
    onClose();

    return null;
  });
  const values = form.values;

  if (shownFor !== client) {
    setShownFor(client);
    form.reset(formFor(client));
    setProblem(null);
    setVerdict(null);
  }

  const kind = CLIENT_KINDS.find((one) => one.id === values.kind);
  const isSabnzbd = values.kind === 'sabnzbd';

  const change = (next: Partial<DownloadClientForm>) => {
    for (const key of DOWNLOAD_CLIENT_FORM_KEYS) {
      const given = next[key];

      if (given !== undefined) {
        form.set(key, given);
      }
    }

    setVerdict(null);
    setProblem(null);
  };

  const tryIt = () => {
    const draft = form.check();

    if (draft === null) {
      return;
    }

    setIsTrying(true);
    setVerdict(null);
    setProblem(null);

    void tryDownloadClient(draft, client?.id)
      .then(({ value, refusal }) => {
        setVerdict(value?.isWorking === true ? 'working' : 'failing');
        setVersion(value?.version ?? null);
        setProblem(
          value === null
            ? (refusal?.message ?? say('common.itCouldNotBeTried'))
            : value.isWorking
              ? null
              : (sayAgainIfAny(value.problem) ?? say('common.itDidNotAnswer')),
        );
      })
      .finally(() => {
        setIsTrying(false);
      });
  };

  const isWorking = isTrying || form.isSubmitting;

  const title =
    client === null
      ? say('common.addADownloadClient')
      : say('common.changeName', { name: client.name });
  const secretDetail = (isKept: boolean, what: string) =>
    isKept
      ? say('screens.adminArea.downloadClientDialog.aWhatIsKeptTypeA', { what })
      : say('screens.adminArea.downloadClientDialog.leaveThisEmptyForAClient', { what });

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail={say('screens.adminArea.downloadClientDialog.valenceHandsTorrentsToQBittorrentOr')}
      />

      <Form label={title} onSubmit={form.submit} isDialog>
        <DialogContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {client === null ? (
              <FormField label={say('common.client')}>
                <SegmentedRow
                  label={say('common.client')}
                  size="sm"
                  items={CLIENT_KINDS}
                  value={values.kind}
                  onSelect={(next) => {
                    const chosen = CLIENT_KINDS.find((one) => one.id === next);

                    if (chosen !== undefined) {
                      change(choosingKind(values, chosen.id));
                    }
                  }}
                />
              </FormField>
            ) : null}

            <TextField
              label={say('common.name')}
              {...form.text('name')}
              placeholder={kind?.label ?? ''}
              required
            />

            <Switch
              label={say('screens.adminArea.downloadClientDialog.sendReleasesToThisClient')}
              isOn={values.isEnabled}
              onToggle={() => {
                change({ isEnabled: !values.isEnabled });
              }}
            />
          </div>

          <HeadedSection title={say('common.connection')}>
            <div className="flex flex-col gap-4">
              <TextField
                label={say('common.address')}
                type="url"
                {...form.text('url')}
                placeholder={kind?.address ?? ''}
                description={say(
                  'screens.adminArea.downloadClientDialog.whereTheRequestsServiceReachesIt',
                )}
                required
              />

              {isSabnzbd ? (
                <TextField
                  label={say('common.aPIKey')}
                  type="password"
                  {...form.text('apiKey')}
                  description={say(
                    'screens.adminArea.downloadClientDialog.valueItIsUnderConfigGeneral',
                    { value: secretDetail(client?.hasApiKey === true, 'key') },
                  )}
                  autoComplete="off"
                />
              ) : (
                <FormField
                  label={say('common.login')}
                  description={secretDetail(client?.hasPassword === true, 'password')}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label={say('common.username')}
                      {...form.text('username')}
                      autoComplete="off"
                    />

                    <TextField
                      label={say('common.password')}
                      type="password"
                      {...form.text('password')}
                      autoComplete="new-password"
                    />
                  </div>
                </FormField>
              )}
            </div>
          </HeadedSection>

          <HeadedSection title={say('common.downloads')}>
            <div className="flex flex-col gap-4">
              <FormField
                label={
                  values.kind === 'transmission'
                    ? say('screens.adminArea.downloadClientDialog.labels')
                    : say('common.categories')
                }
                description={
                  values.kind === 'transmission'
                    ? say('screens.adminArea.downloadClientDialog.theLabelValencePutsOnWhat')
                    : say('screens.adminArea.downloadClientDialog.whereValenceFilesWhatItSends')
                }
                {...(form.errorOf('categories') === undefined
                  ? {}
                  : { error: form.errorOf('categories') ?? '' })}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {LIBRARY_KINDS.map((libraryKind) => (
                    <TextField
                      key={libraryKind}
                      label={LIBRARY_KIND_NAMES[libraryKind].label}
                      value={values.categories[libraryKind]}
                      onValueChange={(category) => {
                        change({ categories: { ...values.categories, [libraryKind]: category } });
                      }}
                      required
                    />
                  ))}
                </div>
              </FormField>

              <FormField
                label={say('screens.adminArea.downloadClientDialog.whereItSavesDownloads')}
                description={say(
                  'screens.adminArea.downloadClientDialog.onlyWhereTheClientAndValence',
                )}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label={say('screens.adminArea.downloadClientDialog.asTheClientSeesIt')}
                    {...form.text('remotePath')}
                    placeholder="/downloads"
                  />

                  <TextField
                    label={say('screens.adminArea.downloadClientDialog.asValenceSeesIt')}
                    {...form.text('localPath')}
                    placeholder="/downloads"
                  />
                </div>
              </FormField>

              <TextField
                label={say('common.priority')}
                type="number"
                min={1}
                max={50}
                {...form.text('priority')}
                description={say(
                  'screens.adminArea.downloadClientDialog.theLowestIsSentReleasesFirst',
                )}
              />
            </div>
          </HeadedSection>

          <p role="status" className="sr-only">
            {verdict !== 'working'
              ? ''
              : version === null
                ? say('screens.adminArea.downloadClientDialog.itAnsweredAndIsWorking')
                : say('screens.adminArea.downloadClientDialog.itAnsweredAndIsVersion', { version })}
          </p>
        </DialogContent>

        <DialogFooter
          note={problem ?? form.problem}
          dismiss={{ onChoose: onClose }}
          confirm={{
            label:
              client === null
                ? say('screens.adminArea.downloadClientDialog.addClient')
                : say('common.save'),
            isSubmit: true,
            isLoading: form.isSubmitting,
            isDisabled: isTrying,
          }}
        >
          <TryItButton isTrying={isTrying} verdict={verdict} isDisabled={isWorking} onTry={tryIt} />
        </DialogFooter>
      </Form>
    </DialogCompanion>
  );
};

DownloadClientDialog.displayName = 'DownloadClientDialog';

export { DownloadClientDialog };
