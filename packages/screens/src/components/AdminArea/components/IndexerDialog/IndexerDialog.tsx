import { notify } from '@ValenceUI/notify';
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
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const KEEPING: readonly { id: IndexerForm['removesWhenDone']; labelKey: StringKey }[] = [
  { id: 'tracker', labelKey: 'admin.indexerDialog.followTracker' },
  { id: 'always', labelKey: 'admin.indexerDialog.alwaysDelete' },
  { id: 'never', labelKey: 'admin.indexerDialog.neverDelete' },
];

const KINDS = [
  { id: 'torznab', labelKey: 'admin.indexerDialog.torznab' },
  { id: 'newznab', labelKey: 'admin.indexerDialog.newznab' },
] as const satisfies readonly { id: string; labelKey: StringKey }[];

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
          setProblem(refusal?.message ?? say('admin.indexerDialog.couldNotTry'));

          return;
        }

        if (value.captcha !== null) {
          setProblem(null);

          return;
        }

        setVerdict(value.isWorking ? 'working' : 'failing');
        setProblem(
          value.isWorking ? null : (value.problem ?? say('admin.indexerDialog.didNotAnswer')),
        );
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
          setProblem(refusal?.message ?? say('admin.indexerDialog.couldNotSave'));

          return;
        }

        notify.worked(
          indexer === null
            ? say('admin.indexerDialog.added', { name: value.name })
            : say('admin.indexerDialog.saved', { name: value.name }),
        );
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
      ? say('admin.indexerDialog.changeTitle', { name: indexer.name })
      : start?.kind === 'cardigann'
        ? say('admin.indexerDialog.addSiteTitle', { name: start.name })
        : say('admin.indexerDialog.addTitle');

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail={
          isSite
            ? (definition?.description ?? say('admin.indexerDialog.readingSiteEllipsis'))
            : say('admin.indexerDialog.genericDetail')
        }
      />

      <DialogContent className="flex flex-col gap-4">
        {isSite ? null : (
          <FormField
            label={say('admin.indexerDialog.kind')}
            description={say('admin.indexerDialog.kindDetail')}
          >
            <SegmentedRow
              label={say('admin.indexerDialog.kind')}
              size="sm"
              items={KINDS.map((one) => ({ id: one.id, label: say(one.labelKey) }))}
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
          label={say('admin.indexerDialog.name')}
          value={form.name}
          onValueChange={(name) => {
            change({ name });
          }}
          placeholder={say('admin.indexerDialog.namePlaceholder')}
          required
        />

        {isSite ? (
          detail.isPending ? (
            <Spinner isCentered label={say('admin.indexerDialog.readingSite')} size="sm" />
          ) : definition === null ? (
            <p role="alert" className="text-sm text-danger">
              {say('admin.indexerDialog.definitionGone')}
            </p>
          ) : (
            <>
              <FormField
                label={say('admin.indexerDialog.address')}
                description={say('admin.indexerDialog.siteAddressDetail')}
              >
                <OptionMenu
                  label={say('admin.indexerDialog.address')}
                  triggerShape="field"
                  matchTriggerWidth
                  groups={[
                    {
                      name: say('admin.indexerDialog.address'),
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
              label={say('admin.indexerDialog.address')}
              type="url"
              value={form.url}
              onValueChange={(next) => {
                change({ url: next });
              }}
              placeholder="http://jackett:9117/api/v2.0/indexers/all/results/torznab/"
              description={say('admin.indexerDialog.addressDetail')}
              required
            />

            <TextField
              label={say('admin.indexerDialog.apiKey')}
              type="password"
              value={form.apiKey}
              onValueChange={(apiKey) => {
                change({ apiKey });
              }}
              description={
                indexer?.hasApiKey === true
                  ? say('admin.indexerDialog.keyKept')
                  : say('admin.indexerDialog.keyNone')
              }
              autoComplete="off"
            />
          </>
        )}

        {tried?.captcha === null || tried?.captcha === undefined ? null : (
          <FormField
            label={say('admin.indexerDialog.captcha')}
            description={say('admin.indexerDialog.captchaDetail')}
          >
            <div className="flex flex-col items-start gap-2">
              <img
                src={tried.captcha.image}
                alt={say('admin.indexerDialog.captchaAlt')}
                className="rounded border border-[var(--surface-line)]"
              />
              <TextField
                label={say('admin.indexerDialog.captchaField')}
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
            label={say('admin.indexerDialog.priority')}
            type="number"
            min={1}
            max={50}
            value={form.priority}
            onValueChange={(priority) => {
              change({ priority });
            }}
            description={say('admin.indexerDialog.priorityDetail')}
          />

          <TextField
            label={say('admin.indexerDialog.perMinute')}
            type="number"
            min={1}
            max={600}
            value={form.requestsPerMinute}
            onValueChange={(requestsPerMinute) => {
              change({ requestsPerMinute });
            }}
            placeholder={say('admin.indexerDialog.noLimit')}
          />

          <TextField
            label={say('admin.indexerDialog.wait')}
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
          label={say('admin.indexerDialog.searchThis')}
          isOn={form.isEnabled}
          onToggle={() => {
            change({ isEnabled: !form.isEnabled });
          }}
        />

        <FormField
          label={say('admin.indexerDialog.afterFiled')}
          description={say('admin.indexerDialog.afterFiledDetail')}
        >
          <SegmentedRow
            label={say('admin.indexerDialog.afterFiled')}
            size="sm"
            items={KEEPING.map((one) => ({ id: one.id, label: say(one.labelKey) }))}
            value={form.removesWhenDone}
            onSelect={(next) => {
              const chosen = KEEPING.find((one) => one.id === next)?.id;

              if (chosen !== undefined) {
                change({ removesWhenDone: chosen });
              }
            }}
          />
        </FormField>

        {form.removesWhenDone === 'never' ? null : (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={say('admin.indexerDialog.seedTime')}
              type="number"
              min={0}
              value={form.seedSeconds}
              onValueChange={(seedSeconds) => {
                change({ seedSeconds });
              }}
              placeholder={say('admin.indexerDialog.trackerAsks')}
              description={say('admin.indexerDialog.whicheverHigher')}
            />

            <TextField
              label={say('admin.indexerDialog.seedRatio')}
              type="number"
              min={0}
              value={form.seedRatio}
              onValueChange={(seedRatio) => {
                change({ seedRatio });
              }}
              placeholder={say('admin.indexerDialog.trackerAsks')}
              description={say('admin.indexerDialog.whicheverHigher')}
            />
          </div>
        )}

        {categories.length === 0 ? null : (
          <FormField
            label={say('admin.indexerDialog.categories')}
            description={say('admin.indexerDialog.categoriesDetail')}
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
            ? (tried.capabilities?.modes ?? []).length === 0
              ? say('admin.indexerDialog.answeredWords')
              : say('admin.indexerDialog.answeredModes', {
                  modes: (tried.capabilities?.modes ?? []).map((one) => one.mode).join(', '),
                })
            : ''}
        </p>
      </DialogContent>

      <DialogFooter
        note={problem}
        dismiss={{
          label: onBack === undefined ? undefined : say('common.back'),
          onChoose: onBack ?? onClose,
        }}
        confirm={{
          label: indexer === null ? say('admin.indexerDialog.addIndexer') : say('common.save'),
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
