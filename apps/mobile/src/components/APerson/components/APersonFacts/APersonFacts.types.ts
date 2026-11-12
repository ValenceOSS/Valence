import type { PersonFact } from '@ValenceClient/people/describePersonFacts';

type APersonFactsProps = {
  facts: readonly PersonFact[];
  instagram: string | null;
};

export type { APersonFactsProps };
