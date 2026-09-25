import { notify } from '@ValenceUI/notify';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronsUpDown as ChevronsUpDownIcon,
  RefreshCw as RefreshCwIcon,
} from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { refreshCatalogue } from '@ValenceClient/requests/fetchDefinitions';
import { filterCatalogue } from './filterCatalogue';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type {
  IndexerDefinitionSummary,
  IndexerPrivacy,
} from '@ValenceContracts/schemas/IndexerDefinition';
import type { IndexerCatalogueDialogProps } from './IndexerCatalogueDialog.types';
import { Card } from '@ValenceUI/Card';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const PRIVACIES = [
  { id: 'any', labelKey: 'admin.indexerCatalogueDialog.anyPrivacy' },
  { id: 'public', labelKey: 'admin.indexerCatalogueDialog.public' },
  { id: 'semi-private', labelKey: 'admin.indexerCatalogueDialog.semiPrivate' },
  { id: 'private', labelKey: 'admin.indexerCatalogueDialog.private' },
] as const satisfies readonly { id: IndexerPrivacy | 'any'; labelKey: StringKey }[];

const PRIVACY: Readonly<Record<IndexerPrivacy, { labelKey: StringKey; tone: BadgeTone }>> = {
  public: { labelKey: 'admin.indexerCatalogueDialog.public', tone: 'success' },
  'semi-private': { labelKey: 'admin.indexerCatalogueDialog.semiPrivate', tone: 'warning' },
  private: { labelKey: 'admin.indexerCatalogueDialog.private', tone: 'accent' },
};

const GENERIC: readonly {
  id: 'torznab' | 'newznab';
  nameKey: StringKey;
  descriptionKey: StringKey;
}[] = [
  {
    id: 'torznab',
    nameKey: 'admin.indexerCatalogueDialog.torznab',
    descriptionKey: 'admin.indexerCatalogueDialog.torznabDetail',
  },
  {
    id: 'newznab',
    nameKey: 'admin.indexerCatalogueDialog.newznab',
    descriptionKey: 'admin.indexerCatalogueDialog.newznabDetail',
  },
];

const FILTERS = {
  category: {
    nameKey: 'admin.indexerCatalogueDialog.category',
    filterKey: 'admin.indexerCatalogueDialog.filterByCategory',
    anyKey: 'admin.indexerCatalogueDialog.anyCategory',
  },
  language: {
    nameKey: 'admin.indexerCatalogueDialog.language',
    filterKey: 'admin.indexerCatalogueDialog.filterByLanguage',
    anyKey: 'admin.indexerCatalogueDialog.anyLanguage',
  },
} as const satisfies Record<
  string,
  { nameKey: StringKey; filterKey: StringKey; anyKey: StringKey }
>;

/**
 * Chooses what to add: a site from the catalogue of definitions, found by name, privacy, category or
 * language — or a generic Torznab or Newznab feed for anything else. The catalogue says when it was
 * last brought up to date, and can be brought up to date from here.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called when it is dismissed.
 * @param onChoose - Called with what was chosen.
 */
const IndexerCatalogueDialog = ({ isOpen, onClose, onChoose }: IndexerCatalogueDialogProps) => {
  const cache = useQueryClient();
  const asked = useQuery({ ...requestsQueries.catalogue(), enabled: isOpen });
  const [words, setWords] = useState('');
  const [privacy, setPrivacy] = useState<IndexerPrivacy | 'any'>('any');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const definitions = asked.data?.definitions;
  const shown = useMemo(
    () => filterCatalogue(definitions ?? [], { words, privacy, category, language }),
    [definitions, words, privacy, category, language],
  );
  const categories = useMemo(
    () => [...new Set((definitions ?? []).flatMap((one) => one.categories))].toSorted(),
    [definitions],
  );
  const languages = useMemo(
    () => [...new Set((definitions ?? []).map((one) => one.language))].toSorted(),
    [definitions],
  );

  const columns = useMemo<DataTableColumn<IndexerDefinitionSummary>[]>(
    () => [
      {
        id: 'name',
        header: say('admin.indexerCatalogueDialog.site'),
        accessorFn: (definition) => definition.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-text">{row.original.name}</span>
            <span className="line-clamp-2 text-xs text-text-muted">{row.original.description}</span>
          </span>
        ),
      },
      {
        id: 'language',
        header: say('admin.indexerCatalogueDialog.language'),
        accessorFn: (definition) => definition.language,
        cell: ({ row }) => <span className="text-xs text-text-muted">{row.original.language}</span>,
      },
      {
        id: 'privacy',
        header: say('admin.indexerCatalogueDialog.privacy'),
        accessorFn: (definition) => definition.privacy,
        cell: ({ row }) => (
          <Badge size="sm" tone={PRIVACY[row.original.privacy].tone}>
            {say(PRIVACY[row.original.privacy].labelKey)}
          </Badge>
        ),
      },
      {
        id: 'categories',
        header: say('admin.indexerCatalogueDialog.has'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex flex-wrap gap-1">
            {row.original.categories.map((name) => (
              <Badge key={name} size="sm">
                {name}
              </Badge>
            ))}
          </span>
        ),
      },
    ],
    [],
  );

  const refresh = () => {
    setIsRefreshing(true);
    setProblem(null);

    void refreshCatalogue()
      .then((fresh) => {
        cache.setQueryData(requestsQueries.catalogue().queryKey, fresh);
        notify.worked(say('admin.indexerCatalogueDialog.refreshed'));
      })
      .catch(() => {
        notify.failed(say('admin.indexerCatalogueDialog.couldNotRefresh'));
        setProblem(say('admin.indexerCatalogueDialog.couldNotRefresh'));
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  const menu = (
    filter: (typeof FILTERS)[keyof typeof FILTERS],
    value: string,
    options: readonly string[],
    onSelect: (next: string) => void,
  ) => (
    <OptionMenu
      label={say(filter.filterKey)}
      triggerShape="field"
      className="w-40"
      groups={[
        {
          name: say(filter.nameKey),
          selectedId: value,
          onSelect,
          options: [
            { id: '', label: say(filter.anyKey) },
            ...options.map((option) => ({ id: option, label: option })),
          ],
        },
      ]}
      trigger={
        <>
          <span className="truncate">{value === '' ? say(filter.anyKey) : value}</span>
          <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
        </>
      }
    />
  );

  return (
    <DialogCompanion
      label={say('admin.indexerCatalogueDialog.title')}
      isOpen={isOpen}
      onClose={onClose}
      size="stage"
    >
      <DialogTitle
        size="compact"
        title={say('admin.indexerCatalogueDialog.title')}
        detail={say('admin.indexerCatalogueDialog.detail')}
      />

      <DialogContent className="flex min-h-0 flex-col gap-4 overflow-hidden">
        <div className="grid shrink-0 gap-2 sm:grid-cols-2">
          {GENERIC.map((generic) => (
            <Button
              key={generic.id}
              variant="secondary"
              size="none"
              className="flex flex-col items-start gap-0.5 px-3 py-2 text-left"
              onClick={() => {
                onChoose({ kind: generic.id });
              }}
            >
              <span className="text-sm font-medium text-text">{say(generic.nameKey)}</span>
              <span className="text-xs text-text-muted">{say(generic.descriptionKey)}</span>
            </Button>
          ))}
        </div>

        <div className="flex shrink-0 flex-wrap items-end gap-3">
          <TextField
            label={say('admin.indexerCatalogueDialog.findSite')}
            type="search"
            value={words}
            onValueChange={setWords}
            placeholder={say('admin.indexerCatalogueDialog.findSitePlaceholder')}
            className="min-w-[14rem] flex-1"
          />
          {menu(FILTERS.category, category, categories, setCategory)}
          {menu(FILTERS.language, language, languages, setLanguage)}
        </div>

        <SegmentedRow
          label={say('admin.indexerCatalogueDialog.privacy')}
          size="sm"
          className="shrink-0 self-start"
          items={PRIVACIES.map((one) => ({ id: one.id, label: say(one.labelKey) }))}
          value={privacy}
          onSelect={(next) => {
            const chosen = PRIVACIES.find((one) => one.id === next)?.id;

            if (chosen !== undefined) {
              setPrivacy(chosen);
            }
          }}
        />

        {asked.isError ? (
          <CouldNotRead
            what={say('admin.indexerCatalogueDialog.theCatalogue')}
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : asked.isPending ? (
          <Spinner isCentered label={say('admin.indexerCatalogueDialog.reading')} size="sm" />
        ) : (
          <Card padding="none" className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DataTable
              label={say('admin.indexerCatalogueDialog.sites')}
              columns={columns}
              rows={shown}
              height="parent"
              growsOnScroll
              className="min-h-0 flex-1"
              getRowId={(definition) => definition.id}
              onChooseRow={(definition) => {
                onChoose({ kind: 'cardigann', definitionId: definition.id, name: definition.name });
              }}
              emptyMessage={
                asked.data.definitions.length === 0
                  ? say('admin.indexerCatalogueDialog.empty')
                  : say('admin.indexerCatalogueDialog.noMatch')
              }
            />
          </Card>
        )}
      </DialogContent>

      <DialogFooter note={problem ?? asked.data?.problem} dismiss={{ onChoose: onClose }}>
        <Button variant="secondary" isLoading={isRefreshing} onClick={refresh}>
          <Icon of={RefreshCwIcon} size={15} />
          {say('admin.indexerCatalogueDialog.refresh')}
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

IndexerCatalogueDialog.displayName = 'IndexerCatalogueDialog';

export { IndexerCatalogueDialog };
