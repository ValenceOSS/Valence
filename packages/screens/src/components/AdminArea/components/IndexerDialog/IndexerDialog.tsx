import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { Checkbox } from '@ValenceUI/Checkbox';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { addIndexer, changeIndexer, tryIndexer } from '@ValenceClient/requests/fetchIndexers';
import { TryItButton } from '@ValenceScreens/components/AdminArea/components/TryItButton/TryItButton';
import { DefinitionSettingsFields } from './components/DefinitionSettingsFields/DefinitionSettingsFields';
import { formFor, readIndexerForm } from './readIndexerForm';
import type { IndexerCategory, IndexerTest } from '@ValenceContracts/schemas/Indexer';
import type { IndexerForm } from './readIndexerForm';
import type { IndexerDialogProps } from './IndexerDialog.types';
import type { TryVerdict } from '@ValenceScreens/components/AdminArea/components/TryItButton/TryItButton.types';

const KINDS = [
  { id: 'torznab', label: 'Torznab' },
  { id: 'newznab', label: 'Newznab' },
] as const;

/**
 * Adds an indexer, or changes one already kept.
 *
 * A generic Torznab or Newznab indexer asks for where it answers and its key. A site from the
 * catalogue asks for what its definition asks for instead — its own settings, drawn as the right kind
 * of field, and which of its addresses to use — and, where its login shows a captcha, shows the
 * picture after the first try and asks for what it says.
 *
 * It can be tried before it is saved, which is also how its categories are learnt: choosing some
 * narrows every search to them, and choosing none searches them all. Nothing secret is shown back.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param indexer - The indexer being changed, or null to add one.
 * @param start - What was chosen to add, for a new one.
 * @param onClose - Called when it is dismissed.
 * @param onBack - Called to go back to where it was opened from, where there is somewhere to go
 *   back to — the catalogue of sites a new indexer was chosen from — in place of dismissing it.
 * @param onSaved - Called with the indexer as kept.
 */
const IndexerDialog = ({
  isOpen,
  indexer,
  start = null,
  onClose,
  onBack,
  onSaved,
}: IndexerDialogProps) => {
  const [form, setForm] = useState<IndexerForm>(() => formFor(indexer, start));
  const [shownFor, setShownFor] = useState({ indexer, start });
  const [tried, setTried] = useState<IndexerTest | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isTrying, setIsTrying] = useState(false);
  const [verdict, setVerdict] = useState<TryVerdict>(null);

  if (shownFor.indexer !== indexer || shownFor.start !== start) {
    setShownFor({ indexer, start });
    setForm(formFor(indexer, start));
    setTried(null);
    setVerdict(null);
    setProblem(null);
  }

  const isSite = form.kind === 'cardigann';
  const detail = useQuery(requestsQueries.definition(isSite && isOpen ? form.definitionId : null));
  const definition = detail.data ?? null;
  const url = form.url === '' && definition !== null ? (definition.links[0] ?? '') : form.url;
  const links =
    definition === null ? [] : [...new Set([...definition.links, ...(url === '' ? [] : [url])])];
  const categories: readonly IndexerCategory[] =
    tried?.capabilities?.categories ??
    indexer?.capabilities?.categories ??
    definition?.standardCategories.filter((category) => category.id < 100_000) ??
    [];

  const change = (next: Partial<IndexerForm>) => {
    setForm((current) => ({ ...current, ...next }));
    setVerdict(null);
    setProblem(null);
  };

  const setSetting = (name: string, value: string | boolean) => {
    setForm((current) => ({ ...current, settings: { ...current.settings, [name]: value } }));
    setVerdict(null);
    setProblem(null);
  };

  const read = () => {
    const withDefaults: IndexerForm = {
      ...form,
      url,
      settings: {
        ...Object.fromEntries(
          (definition?.settings ?? [])
            .filter((setting) => setting.kind !== 'info' && setting.default !== null)
            .map((setting) => [setting.name, setting.default ?? '']),
        ),
        ...form.settings,
      },
    };
    const outcome = readIndexerForm(withDefaults);

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
    setTried(null);
    setVerdict(null);

    void tryIndexer(draft, indexer?.id)
      .then(({ value, refusal }) => {
        setTried(value);

        if (value === null) {
          setVerdict('failing');
          setProblem(refusal?.message ?? 'It could not be tried.');

          return;
        }

        if (value.captcha !== null) {
          setProblem(null);

          return;
        }

        setVerdict(value.isWorking ? 'working' : 'failing');
        setProblem(value.isWorking ? null : (value.problem ?? 'It did not answer.'));
        setForm((current) => ({ ...current, settings: { ...current.settings, CAPTCHA: '' } }));
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
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(id)
        ? current.categories.filter((one) => one !== id)
        : [...current.categories, id],
    }));
  };

  const title =
    indexer !== null
      ? `Change ${indexer.name}`
      : start?.kind === 'cardigann'
        ? `Add ${start.name}`
        : 'Add an indexer';

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail={
          isSite
            ? (definition?.description ?? 'Reading what this site needs…')
            : 'Any Torznab or Newznab indexer: a usenet indexer, a tracker, or a feed from Jackett or Prowlarr.'
        }
      />

      <DialogContent className="flex flex-col gap-4">
        {isSite ? null : (
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
        )}

        <TextField
          label="Name"
          value={form.name}
          onValueChange={(name) => {
            change({ name });
          }}
          placeholder="NZBgeek"
          required
        />

        {isSite ? (
          detail.isPending ? (
            <Spinner isCentered label="Reading what this site needs" size="sm" />
          ) : definition === null ? (
            <p role="alert" className="text-sm text-danger">
              This site’s definition is no longer in the catalogue.
            </p>
          ) : (
            <>
              <FormField
                label="Address"
                description="Which of the site’s addresses to use. Try another if one is blocked."
              >
                <OptionMenu
                  label="Address"
                  triggerShape="field"
                  matchTriggerWidth
                  groups={[
                    {
                      name: 'Address',
                      selectedId: url,
                      onSelect: (next) => {
                        change({ url: next });
                      },
                      options: links.map((link) => ({ id: link, label: link })),
                    },
                  ]}
                  trigger={
                    <>
                      <span className="truncate">{url}</span>
                      <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
                    </>
                  }
                />
              </FormField>

              <DefinitionSettingsFields
                settings={definition.settings}
                values={form.settings}
                secretsSet={indexer?.secretsSet ?? []}
                onChange={setSetting}
              />
            </>
          )
        ) : (
          <>
            <TextField
              label="Address"
              type="url"
              value={form.url}
              onValueChange={(next) => {
                change({ url: next });
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
          </>
        )}

        {tried?.captcha === null || tried?.captcha === undefined ? null : (
          <FormField
            label="Captcha"
            description="Type the characters in the picture, then try again."
          >
            <div className="flex flex-col items-start gap-2">
              <img
                src={tried.captcha.image}
                alt="The characters to type"
                className="rounded border border-[var(--surface-line)]"
              />
              <TextField
                label="Characters in the picture"
                isLabelHidden
                value={typeof form.settings['CAPTCHA'] === 'string' ? form.settings['CAPTCHA'] : ''}
                onValueChange={(next) => {
                  setSetting('CAPTCHA', next);
                }}
                autoComplete="off"
              />
            </div>
          </FormField>
        )}

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

        {categories.length === 0 ? null : (
          <FormField
            label="Categories"
            description="Only search these. Choose none to search every category the indexer has."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
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

        <p role="status" className="sr-only">
          {verdict === 'working' && tried !== null
            ? `It answered, and can search ${
                (tried.capabilities?.modes ?? []).map((one) => one.mode).join(', ') || 'by words'
              }.`
            : ''}
        </p>
      </DialogContent>

      <DialogFooter
        note={problem}
        dismiss={{
          label: onBack === undefined ? undefined : 'Back',
          onChoose: onBack ?? onClose,
        }}
        confirm={{
          label: indexer === null ? 'Add indexer' : 'Save',
          onChoose: save,
          isDisabled: isWorking || (isSite && definition === null),
        }}
      >
        <TryItButton isTrying={isTrying} verdict={verdict} isDisabled={isWorking} onTry={tryIt} />
      </DialogFooter>
    </DialogCompanion>
  );
};

IndexerDialog.displayName = 'IndexerDialog';

export { IndexerDialog };
