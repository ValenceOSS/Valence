import type { ReactNode } from 'react';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';

type StreamLimitEditorProps = {
  own: StreamLimit | undefined;
  onSave: (limit: StreamLimit) => Promise<boolean>;
  children?: ReactNode;
};

export type { StreamLimitEditorProps };
