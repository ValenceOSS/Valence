import { notify } from '@ValenceUI/notify';
import { useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
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
import {
  CLIENT_KINDS,
  choosingKind,
  formFor,
  readDownloadClientForm,
} from './readDownloadClientForm';
import type { TryVerdict } from '@ValenceScreens/components/AdminArea/components/TryItButton/TryItButton.types';
import type { DownloadClientForm } from './readDownloadClientForm';
import type { DownloadClientDialogProps } from './DownloadClientDialog.types';
import { say } from '@ValenceI18n/say';

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
  const [form, setForm] = useState<DownloadClientForm>(() => formFor(client));
  const [shownFor, setShownFor] = useState(client);
  const [problem, setProblem] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isTrying, setIsTrying] = useState(false);
  const [verdict, setVerdict] = useState<TryVerdict>(null);
  const [version, setVersion] = useState<string | null>(null);

  if (shownFor !== client) {
    setShownFor(client);
    setForm(formFor(client));
    setProblem(null);
    setVerdict(null);
  }

  const kind = CLIENT_KINDS.find((one) => one.id === form.kind);
  const isSabnzbd = form.kind === 'sabnzbd';

  const change = (next: Partial<DownloadClientForm>) => {
    setForm((current) => ({ ...current, ...next }));
    setVerdict(null);
    setProblem(null);
  };

  const read = () => {
    const outcome = readDownloadClientForm(form);

    setProblem(outcome.problem);

    return outcome.draft;
  };

  const tryIt = () => {
    const draft = read();

    if (draft === null) {
      return;
    }

    setIsWorking(true);
    setIsTrying(true);
    setVerdict(null);

    void tryDownloadClient(draft, client?.id)
      .then(({ value, refusal }) => {
        setVerdict(value?.isWorking === true ? 'working' : 'failing');
        setVersion(value?.version ?? null);
        setProblem(
          value === null
            ? (refusal?.message ?? say('admin.downloadClientDialog.couldNotTry'))
            : value.isWorking
              ? null
              : (value.problem ?? say('admin.downloadClientDialog.didNotAnswer')),
        );
      })
      .finally(() => {
        setIsWorking(false);
        setIsTrying(false);
      });
  };

  const save = () => {
    const draft = read();

    if (draft === null) {
      return;
    }

    setIsWorking(true);

    void (client === null ? addDownloadClient(draft) : changeDownloadClient(client.id, draft))
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? say('admin.downloadClientDialog.couldNotSave'));

          return;
        }

        notify.worked(
          client === null
            ? say('admin.downloadClientDialog.added', { name: value.name })
            : say('admin.downloadClientDialog.saved', { name: value.name }),
        );
        onSaved(value);
        onClose();
      })
      .finally(() => {
        setIsWorking(false);
      });
  };

  const title =
    client === null
      ? say('admin.downloadClientDialog.addTitle')
      : say('admin.downloadClientDialog.changeTitle', { name: client.name });

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle size="compact" title={title} detail={say('admin.downloadClientDialog.lede')} />

      <DialogContent className="flex flex-col gap-4">
        {client === null ? (
          <FormField label={say('admin.downloadClientDialog.client')}>
            <SegmentedRow
              label={say('admin.downloadClientDialog.client')}
              size="sm"
              items={CLIENT_KINDS}
              value={form.kind}
              onSelect={(next) => {
                const chosen = CLIENT_KINDS.find((one) => one.id === next);

                if (chosen !== undefined) {
                  change(choosingKind(form, chosen.id));
                }
              }}
            />
          </FormField>
        ) : null}

        <TextField
          label={say('admin.downloadClientDialog.name')}
          value={form.name}
          onValueChange={(name) => {
            change({ name });
          }}
          placeholder={kind?.label ?? ''}
          required
        />

        <TextField
          label={say('admin.downloadClientDialog.address')}
          type="url"
          value={form.url}
          onValueChange={(url) => {
            change({ url });
          }}
          placeholder={kind?.address ?? ''}
          description={say('admin.downloadClientDialog.addressDetail')}
          required
        />

        {isSabnzbd ? (
          <TextField
            label={say('admin.downloadClientDialog.apiKey')}
            type="password"
            value={form.apiKey}
            onValueChange={(apiKey) => {
              change({ apiKey });
            }}
            description={
              client?.hasApiKey === true
                ? say('admin.downloadClientDialog.apiKeyKept')
                : say('admin.downloadClientDialog.apiKeyNone')
            }
            autoComplete="off"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={say('admin.downloadClientDialog.username')}
              value={form.username}
              onValueChange={(username) => {
                change({ username });
              }}
              autoComplete="off"
            />

            <TextField
              label={say('admin.downloadClientDialog.password')}
              type="password"
              value={form.password}
              onValueChange={(password) => {
                change({ password });
              }}
              description={
                client?.hasPassword === true
                  ? say('admin.downloadClientDialog.passwordKept')
                  : say('admin.downloadClientDialog.passwordNone')
              }
              autoComplete="new-password"
            />
          </div>
        )}

        <FormField
          label={
            form.kind === 'transmission'
              ? say('admin.downloadClientDialog.labels')
              : say('admin.downloadClientDialog.categories')
          }
          description={
            form.kind === 'transmission'
              ? say('admin.downloadClientDialog.labelsDetail')
              : say('admin.downloadClientDialog.categoriesDetail')
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {LIBRARY_KINDS.map((libraryKind) => (
              <TextField
                key={libraryKind}
                label={say(LIBRARY_KIND_NAMES[libraryKind].labelKey)}
                value={form.categories[libraryKind]}
                onValueChange={(category) => {
                  change({ categories: { ...form.categories, [libraryKind]: category } });
                }}
                required
              />
            ))}
          </div>
        </FormField>

        <FormField
          label={say('admin.downloadClientDialog.savesTo')}
          description={say('admin.downloadClientDialog.savesToDetail')}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label={say('admin.downloadClientDialog.asClientSees')}
              value={form.remotePath}
              onValueChange={(remotePath) => {
                change({ remotePath });
              }}
              placeholder="/downloads"
            />

            <TextField
              label={say('admin.downloadClientDialog.asValenceSees')}
              value={form.localPath}
              onValueChange={(localPath) => {
                change({ localPath });
              }}
              placeholder="/downloads"
            />
          </div>
        </FormField>

        <TextField
          label={say('admin.downloadClientDialog.priority')}
          type="number"
          min={1}
          max={50}
          value={form.priority}
          onValueChange={(priority) => {
            change({ priority });
          }}
          description={say('admin.downloadClientDialog.priorityDetail')}
        />

        <Switch
          label={say('admin.downloadClientDialog.enabled')}
          isOn={form.isEnabled}
          onToggle={() => {
            change({ isEnabled: !form.isEnabled });
          }}
        />

        <p role="status" className="sr-only">
          {verdict === 'working'
            ? version === null
              ? say('admin.downloadClientDialog.answeredWorking')
              : say('admin.downloadClientDialog.answeredVersion', { version })
            : ''}
        </p>
      </DialogContent>

      <DialogFooter
        note={problem}
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: client === null ? say('admin.downloadClientDialog.addClient') : say('common.save'),
          onChoose: save,
          isDisabled: isWorking,
        }}
      >
        <TryItButton isTrying={isTrying} verdict={verdict} isDisabled={isWorking} onTry={tryIt} />
      </DialogFooter>
    </DialogCompanion>
  );
};

DownloadClientDialog.displayName = 'DownloadClientDialog';

export { DownloadClientDialog };
