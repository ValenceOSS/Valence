import { SaidError } from '@ValenceI18n/SaidError';
import { saying } from '@ValenceI18n/saying';

class SelectorMiss extends SaidError {
  public constructor(what: string | null) {
    super(
      what === null
        ? saying('requests.cardigann.nothingMatchedAnyCase')
        : saying('requests.cardigann.nothingMatched', { what }),
    );
    this.name = 'SelectorMiss';
  }
}

export { SelectorMiss };
