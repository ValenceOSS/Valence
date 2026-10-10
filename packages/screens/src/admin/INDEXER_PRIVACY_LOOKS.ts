import { say } from '@ValenceI18n/say';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { IndexerPrivacy } from '@ValenceContracts/schemas/IndexerDefinition';

const INDEXER_PRIVACY_LOOKS: Readonly<Record<IndexerPrivacy, { label: string; tone: BadgeTone }>> =
  {
    public: { label: say('screens.adminArea.indexerCatalogueDialog.public'), tone: 'success' },
    'semi-private': { label: say('screens.admin.indexerPrivacy.semiPrivate'), tone: 'warning' },
    private: { label: say('screens.adminArea.indexerCatalogueDialog.private'), tone: 'warning' },
  };

export { INDEXER_PRIVACY_LOOKS };
