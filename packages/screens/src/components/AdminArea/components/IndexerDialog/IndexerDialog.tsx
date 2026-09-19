import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { addIndexer, changeIndexer, tryIndexer } from '@ValenceClient/requests/fetchIndexers';
import { formFor, readIndexerForm } from './readIndexerForm';
import type { IndexerCapabilities, IndexerTest } from '@ValenceContracts/schemas/Indexer';
import type { IndexerForm } from './readIndexerForm';
import type { IndexerDialogProps } from './IndexerDialog.types';

const KINDS = [
  { id: 'torznab', label: 'Torznab' },
  { id: 'newznab', label: 'Newznab' },
] as const;

/**
 * Adds an indexer, or changes one already kept: what kind it is, where it answers, its key, and how
 * hard it may be asked. It can be tried before it is saved, which is also how its categories are
 * learnt — choosing some narrows every search to them, and choosing none searches them all.
 *
 * The key is never shown back. A kept indexer's key field starts empty and is only sent when
 * somebody types a new one, so trying or saving a change uses the key it already has.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param indexer - The indexer being changed, or null to add one.
 * @param onClose - Called when it is dismissed.
 * @param onSaved - Called with the indexer as kept.
 */
const IndexerDialog = ({ isOpen, indexer, onClose, onSaved }: IndexerDialogProps) => {
  const [form, setForm] = useState<IndexerForm>(() => formFor(indexer));
  const [shownFor, setShownFor] = useState(indexer);
  const [tried, setTried] = useState<IndexerTest | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  if (shownFor !== indexer) {
    setShownFor(indexer);
    setForm(formFor(indexer));
    setTried(null);
    setProblem(null);
  }

  const capabilities: IndexerCapabilities | null =
    tried?.capabilities ?? indexer?.capabilities ?? null;

  const change = (next: Partial<IndexerForm>) => {
    setForm((current) => ({ ...current, ...next }));
    setProblem(null);
  };

  const read = () => {
    const outcome = readIndexerForm(form);

    setProblem(outcome.problem);

    return outcome.draft;
  };

  const tryIt = () => {
    const draft = read();

    if (draft === null) {
      return;
    }

    setIsWorking(true);
    setTried(null);

    void tryIndexer(draft, indexer?.id)
      .then(({ value, refusal }) => {
        setTried(value);
        setProblem(refusal?.message ?? null);
      })
      .finally(() => {
        setIsWorking(false);
      });
  };

  const save = () => {
    const draft = read();

    if (draft === null) {
      return;
    }

    const { apiKey, ...rest } = draft;

    setIsWorking(true);

    void (
      indexer === null ? addIndexer(draft) : changeIndexer(indexer.id, apiKey === '' ? rest : draft)
    )
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

  const toggleCategory = (id: number) => {
    change({
      categories: form.categories.includes(id)
        ? form.categories.filter((one) => one !== id)
        : [...form.categories, id],
    });
  };

  const title = indexer === null ? 'Add an indexer' : `Change ${indexer.name}`;

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail="Any Torznab or Newznab indexer: a usenet indexer, a tracker, or a feed from Jackett or Prowlarr."
      />

      <DialogContent className="flex flex-col gap-4">
        <FormField label="Kind" description="Torznab for torrents, Newznab for usenet.">
          <SegmentedRow
            label="Kind"
            size="sm"
            items={KINDS}
            value={form.kind}
            onSelect={(next) => {
              const kind = KINDS.find((one) => one.id === next)?.id;

              if (kind !== undefined) {
                change({ kind });
              }
            }}
          />
        </FormField>

        <TextField
          label="Name"
          value={form.name}
          onValueChange={(name) => {
            change({ name });
          }}
          placeholder="NZBgeek"
          required
        />

        <TextField
          label="Address"
          type="url"
          value={form.url}
          onValueChange={(url) => {
            change({ url });
          }}
          placeholder="http://jackett:9117/api/v2.0/indexers/all/results/torznab/"
          description="The indexer’s site, or the Torznab feed Jackett or Prowlarr gives for it."
          required
        />

        <TextField
          label="API key"
          type="password"
          value={form.apiKey}
          onValueChange={(apiKey) => {
            change({ apiKey });
          }}
          description={
            indexer?.hasApiKey === true
              ? 'A key is kept. Type a new one to replace it, or leave this empty to keep it.'
              : 'Leave this empty for an indexer that needs none.'
          }
          autoComplete="off"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Priority"
            type="number"
            min={1}
            max={50}
            value={form.priority}
            onValueChange={(priority) => {
              change({ priority });
            }}
            description="1 is asked first."
          />

          <TextField
            label="Searches a minute"
            type="number"
            min={1}
            max={600}
            value={form.requestsPerMinute}
            onValueChange={(requestsPerMinute) => {
              change({ requestsPerMinute });
            }}
            placeholder="No limit"
          />

          <TextField
            label="Wait (seconds)"
            type="number"
            min={5}
            max={120}
            value={form.timeoutSeconds}
            onValueChange={(timeoutSeconds) => {
              change({ timeoutSeconds });
            }}
          />
        </div>

        <Switch
          label="Search this indexer"
          isOn={form.isEnabled}
          onToggle={() => {
            change({ isEnabled: !form.isEnabled });
          }}
        />

        {capabilities === null || capabilities.categories.length === 0 ? null : (
          <FormField
            label="Categories"
            description="Only search these. Choose none to search every category the indexer has."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {capabilities.categories.map((category) => (
                <Checkbox
                  key={category.id}
                  label={category.name}
                  checked={form.categories.includes(category.id)}
                  onCheckedChange={() => {
                    toggleCategory(category.id);
                  }}
                />
              ))}
            </div>
          </FormField>
        )}

        {tried === null ? null : (
          <p
            role="status"
            className={tried.isWorking ? 'text-sm text-success' : 'text-sm text-danger'}
          >
            {tried.isWorking
              ? `It answered, and can search ${
                  (tried.capabilities?.modes ?? []).map((one) => one.mode).join(', ') || 'by words'
                }.`
              : (tried.problem ?? 'It did not answer.')}
          </p>
        )}
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

        <Button variant="secondary" disabled={isWorking} onClick={tryIt}>
          Try it
        </Button>

        <Button variant="glossy" disabled={isWorking} onClick={save}>
          {indexer === null ? 'Add indexer' : 'Save'}
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

IndexerDialog.displayName = 'IndexerDialog';

export { IndexerDialog };
