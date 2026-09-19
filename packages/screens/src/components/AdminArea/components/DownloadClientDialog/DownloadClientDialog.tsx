import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
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

/**
 * Adds a download client, or changes one already kept: where it is, how to log in to it, and the
 * category — a label, in Transmission — that marks what Valence sent, so nothing else in the client
 * is ever listed or touched.
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
            ? (refusal?.message ?? 'It could not be tried.')
            : value.isWorking
              ? null
              : (value.problem ?? 'It did not answer.'),
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
          setProblem(refusal?.message ?? 'That could not be saved.');

          return;
        }

        onSaved(value);
        onClose();
      })
      .finally(() => {
        setIsWorking(false);
      });
  };

  const title = client === null ? 'Add a download client' : `Change ${client.name}`;
  const secretDetail = (isKept: boolean, what: string) =>
    isKept
      ? `A ${what} is kept. Type a new one to replace it, or leave this empty to keep it.`
      : `Leave this empty for a client that asks for no ${what}.`;

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail="Valence hands torrents to qBittorrent or Transmission, and NZBs to SABnzbd or NZBGet, and follows each download there."
      />

      <DialogContent className="flex flex-col gap-4">
        {client === null ? (
          <FormField label="Client">
            <SegmentedRow
              label="Client"
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
          label="Name"
          value={form.name}
          onValueChange={(name) => {
            change({ name });
          }}
          placeholder={kind?.label ?? ''}
          required
        />

        <TextField
          label="Address"
          type="url"
          value={form.url}
          onValueChange={(url) => {
            change({ url });
          }}
          placeholder={kind?.address ?? ''}
          description="Where the requests service reaches it, which inside Docker is the container’s name."
          required
        />

        {isSabnzbd ? (
          <TextField
            label="API key"
            type="password"
            value={form.apiKey}
            onValueChange={(apiKey) => {
              change({ apiKey });
            }}
            description={`${secretDetail(client?.hasApiKey === true, 'key')} It is under Config, General.`}
            autoComplete="off"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Username"
              value={form.username}
              onValueChange={(username) => {
                change({ username });
              }}
              autoComplete="off"
            />

            <TextField
              label="Password"
              type="password"
              value={form.password}
              onValueChange={(password) => {
                change({ password });
              }}
              description={secretDetail(client?.hasPassword === true, 'password')}
              autoComplete="new-password"
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Category"
            value={form.category}
            onValueChange={(category) => {
              change({ category });
            }}
            description={
              form.kind === 'transmission'
                ? 'The label Valence puts on what it sends, and the only torrents it looks at.'
                : 'Where Valence files what it sends, and the only downloads it looks at.'
            }
            required
          />

          <TextField
            label="Priority"
            type="number"
            min={1}
            max={50}
            value={form.priority}
            onValueChange={(priority) => {
              change({ priority });
            }}
            description="The lowest is sent releases first."
          />
        </div>

        <Switch
          label="Send releases to this client"
          isOn={form.isEnabled}
          onToggle={() => {
            change({ isEnabled: !form.isEnabled });
          }}
        />

        <p role="status" className="sr-only">
          {verdict === 'working' ? `It answered, and is ${version ?? 'working'}.` : ''}
        </p>
      </DialogContent>

      <DialogFooter>
        {problem === null ? null : (
          <span role="alert" className="mr-auto text-sm text-danger">
            {problem}
          </span>
        )}

        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <TryItButton isTrying={isTrying} verdict={verdict} isDisabled={isWorking} onTry={tryIt} />

        <Button variant="glossy" disabled={isWorking} onClick={save}>
          {client === null ? 'Add client' : 'Save'}
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

DownloadClientDialog.displayName = 'DownloadClientDialog';

export { DownloadClientDialog };
