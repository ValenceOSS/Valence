import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { notify } from '@ValenceUI/notify';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw as RefreshCwIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { ScopedField } from '@ValenceUI/ScopedField';
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

const PRIVACIES = [
  { id: 'any', label: say('common.any') },
  { id: 'public', label: say('screens.adminArea.indexerCatalogueDialog.public') },
  { id: 'semi-private', label: 'Semi-private' },
  { id: 'private', label: say('screens.adminArea.indexerCatalogueDialog.private') },
] as const;

const PRIVACY: Readonly<Record<IndexerPrivacy, { label: string; tone: BadgeTone }>> = {
  public: { label: say('screens.adminArea.indexerCatalogueDialog.public'), tone: 'success' },
  'semi-private': { label: 'Semi-private', tone: 'warning' },
  private: { label: say('screens.adminArea.indexerCatalogueDialog.private'), tone: 'warning' },
};

const GENERIC: readonly { id: 'torznab' | 'newznab'; name: string; description: string }[] = [
  {
    id: 'torznab',
    name: say('screens.adminArea.indexerCatalogueDialog.genericTorznab'),
    description: say('screens.adminArea.indexerCatalogueDialog.anyTorrentIndexerWithATorznab'),
  },
  {
    id: 'newznab',
    name: say('screens.adminArea.indexerCatalogueDialog.genericNewznab'),
    description: say('screens.adminArea.indexerCatalogueDialog.anyUsenetIndexerWithANewznab'),
  },
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
        header: say('common.site'),
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
        header: say('common.language'),
        accessorFn: (definition) => definition.language,
        cell: ({ row }) => <span className="text-xs text-text-muted">{row.original.language}</span>,
      },
      {
        id: 'privacy',
        header: say('screens.adminArea.indexerCatalogueDialog.privacy'),
        accessorFn: (definition) => definition.privacy,
        cell: ({ row }) => (
          <Badge size="sm" tone={PRIVACY[row.original.privacy].tone}>
            {PRIVACY[row.original.privacy].label}
          </Badge>
        ),
      },
      {
        id: 'categories',
        header: say('screens.adminArea.indexerCatalogueDialog.has'),
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
        notify.worked(say('screens.adminArea.indexerCatalogueDialog.broughtTheCatalogueUpToDate'));
      })
      .catch(() => {
        notify.failed(
          say('screens.adminArea.indexerCatalogueDialog.theCatalogueCouldNotBeBrought'),
        );
        setProblem(say('screens.adminArea.indexerCatalogueDialog.theCatalogueCouldNotBeBrought'));
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  const choiceOf = (
    label: string,
    value: string,
    options: readonly string[],
    onChange: (next: string) => void,
  ) => ({
    label: say('screens.adminArea.indexerCatalogueDialog.filterByLabel', {
      label: label.toLowerCase(),
    }),
    value,
    onChange,
    options: [
      {
        id: '',
        label: say('screens.adminArea.indexerCatalogueDialog.anyLabel', {
          label: label.toLowerCase(),
        }),
      },
      ...options.map((option) => ({ id: option, label: option })),
    ],
  });

  return (
    <DialogCompanion
      label={say('common.addAnIndexer')}
      isOpen={isOpen}
      onClose={onClose}
      size="stage"
    >
      <DialogTitle
        size="compact"
        title={say('common.addAnIndexer')}
        detail={say('screens.adminArea.indexerCatalogueDialog.chooseTheSiteToSearchOr')}
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
              <span className="text-sm font-medium text-text">{generic.name}</span>
              <span className="text-xs text-text-muted">{generic.description}</span>
            </Button>
          ))}
        </div>

        <ScopedField
          label={say('screens.adminArea.indexerCatalogueDialog.findASite')}
          value={words}
          onValueChange={setWords}
          placeholder={say('screens.adminArea.indexerCatalogueDialog.n1337xRutrackerAnime')}
          choices={[
            choiceOf(
              say('screens.adminArea.indexerCatalogueDialog.category'),
              category,
              categories,
              setCategory,
            ),
            choiceOf(say('common.language'), language, languages, setLanguage),
          ]}
          className="shrink-0"
        />

        <SegmentedRow
          label={say('screens.adminArea.indexerCatalogueDialog.privacy')}
          size="sm"
          className="shrink-0 self-start"
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
            said={say('common.theCatalogueCouldNotBeRead')}
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : asked.isPending ? (
          <Spinner isCentered label={say('common.readingTheCatalogue')} size="sm" />
        ) : (
          <Card padding="none" className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DataTable
              label={say('screens.adminArea.indexerCatalogueDialog.sites')}
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
                  ? say('screens.adminArea.indexerCatalogueDialog.theCatalogueIsEmptyBringIt')
                  : say('screens.adminArea.indexerCatalogueDialog.noSiteMatchesTryFewerWords')
              }
            />
          </Card>
        )}
      </DialogContent>

      <DialogFooter
        note={problem ?? sayAgainIfAny(asked.data?.problem)}
        dismiss={{ onChoose: onClose }}
      >
        <Button variant="secondary" isLoading={isRefreshing} onClick={refresh}>
          {isRefreshing ? null : <Icon of={RefreshCwIcon} size={15} />}
          {say('screens.adminArea.indexerCatalogueDialog.bringUpToDate')}
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

IndexerCatalogueDialog.displayName = 'IndexerCatalogueDialog';

export { IndexerCatalogueDialog };
