import type { ApiKey } from '@ValenceContracts/schemas/ApiKey';

type ApiKeyListProps = {
  keys: ApiKey[];
  made: { name: string; key: string } | null;
  hasCopied: boolean;
  name: string;
  isMaking: boolean;
  onNameChange: (name: string) => void;
  onCreate: () => void;
  onCopy: () => void;
  onToggle: (key: ApiKey) => void;
  onRevoke: (key: ApiKey) => void;
};

export type { ApiKeyListProps };
