import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshIcon, UnfoldMoreIcon } from '@hugeicons/core-free-icons';
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
import { saidWhen } from '@ValenceClient/format/saidWhen';
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

const PRIVACIES = [
  { id: 'any', label: 'Any' },
  { id: 'public', label: 'Public' },
  { id: 'semi-private', label: 'Semi-private' },
  { id: 'private', label: 'Private' },
] as const;

const PRIVACY: Readonly<Record<IndexerPrivacy, { label: string; tone: BadgeTone }>> = {
  public: { label: 'Public', tone: 'success' },
  'semi-private': { label: 'Semi-private', tone: 'warning' },
  private: { label: 'Private', tone: 'accent' },
};

const GENERIC: readonly { id: 'torznab' | 'newznab'; name: string; description: string }[] = [
  {
    id: 'torznab',
    name: 'Generic Torznab',
    description: 'Any torrent indexer with a Torznab feed, such as one from Jackett or Prowlarr.',
  },
  { id: 'newznab', name: 'Generic Newznab', description: 'Any usenet indexer with a Newznab API.' },
];

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
        header: 'Site',
        accessorFn: (definition) => definition.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-text">{row.original.name}</span>
            <span className="text-xs text-text-muted">{row.original.description}</span>
          </span>
        ),
      },
      {
        id: 'language',
        header: 'Language',
        accessorFn: (definition) => definition.language,
        cell: ({ row }) => <span className="text-xs text-text-muted">{row.original.language}</span>,
      },
      {
        id: 'privacy',
        header: 'Privacy',
        accessorFn: (definition) => definition.privacy,
        cell: ({ row }) => (
          <Badge size="sm" tone={PRIVACY[row.original.privacy].tone}>
            {PRIVACY[row.original.privacy].label}
          </Badge>
        ),
      },
      {
        id: 'categories',
        header: 'Has',
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
      })
      .catch(() => {
        setProblem('The catalogue could not be brought up to date.');
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  const menu = (
    label: string,
    value: string,
    options: readonly string[],
    onSelect: (next: string) => void,
  ) => (
    <OptionMenu
      label={`Filter by ${label.toLowerCase()}`}
      triggerShape="field"
      className="w-40"
      groups={[
        {
          name: label,
          selectedId: value,
          onSelect,
          options: [
            { id: '', label: `Any ${label.toLowerCase()}` },
            ...options.map((option) => ({ id: option, label: option })),
          ],
        },
      ]}
      trigger={
        <>
          <span className="truncate">{value === '' ? `Any ${label.toLowerCase()}` : value}</span>
          <Icon of={UnfoldMoreIcon} size={15} className="shrink-0" />
        </>
      }
    />
  );

  return (
    <DialogCompanion label="Add an indexer" isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title="Add an indexer"
        detail="Choose the site to search, or a generic Torznab or Newznab feed for one that is not listed."
      />

      <DialogContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
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
              <span className="text-sm font-medium text-text">{generic.name}</span>
              <span className="text-xs text-text-muted">{generic.description}</span>
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <TextField
            label="Find a site"
            type="search"
            value={words}
            onValueChange={setWords}
            placeholder="1337x, rutracker, anime…"
            className="min-w-0 flex-1"
          />
          {menu('Category', category, categories, setCategory)}
          {menu('Language', language, languages, setLanguage)}
        </div>

        <SegmentedRow
          label="Privacy"
          size="sm"
          items={PRIVACIES}
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
            what="The catalogue"
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : asked.isPending ? (
          <Spinner label="Reading the catalogue" size="sm" />
        ) : (
          <DataTable
            label="Sites"
            columns={columns}
            rows={shown}
            getRowId={(definition) => definition.id}
            onChooseRow={(definition) => {
              onChoose({ kind: 'cardigann', definitionId: definition.id, name: definition.name });
            }}
            emptyMessage={
              asked.data.definitions.length === 0
                ? 'The catalogue is empty. Bring it up to date to fetch the sites Valence can search.'
                : 'No site matches. Try fewer words, or another category.'
            }
          />
        )}
      </DialogContent>

      <DialogFooter>
        <span role="status" className="mr-auto text-xs text-text-muted">
          {problem ??
            asked.data?.problem ??
            (asked.data === undefined
              ? ''
              : `${asked.data.definitions.length.toString()} sites${asked.data.updatedAt === null ? '' : `, brought up to date ${saidWhen(asked.data.updatedAt)}`} from ${asked.data.source}.`)}
        </span>

        <Button variant="secondary" isLoading={isRefreshing} onClick={refresh}>
          <Icon of={RefreshIcon} size={15} />
          Bring up to date
        </Button>

        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

IndexerCatalogueDialog.displayName = 'IndexerCatalogueDialog';

export { IndexerCatalogueDialog };
