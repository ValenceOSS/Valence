import type { ReactNode } from 'react';
import type { CountedKey } from '@ValenceI18n/CountedKey';
import type { StringKey } from '@ValenceI18n/StringKey';

type SentenceProps =
  | {
      words: StringKey;
      fillings: Readonly<Record<string, ReactNode>>;
    }
  | {
      counted: CountedKey;
      count: number;
      fillings: Readonly<Record<string, ReactNode>>;
    };

export type { SentenceProps };
