import type { IndexerSettings } from '@ValenceContracts/schemas/Indexer';
import type { IndexerDefinitionSetting } from '@ValenceContracts/schemas/IndexerDefinition';

type DefinitionSettingsFieldsProps = {
  settings: readonly IndexerDefinitionSetting[];
  values: IndexerSettings;
  secretsSet: readonly string[];
  onChange: (name: string, value: string | boolean) => void;
};

export type { DefinitionSettingsFieldsProps };
