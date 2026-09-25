import type { StringKey } from './StringKey';

type BaseOf<Key> = Key extends `${infer Base}.other`
  ? `${Base}.one` extends StringKey
    ? Base
    : never
  : never;

type CountedKey = BaseOf<StringKey>;

export type { CountedKey };
