import { describe, expect, it } from 'vitest';
import { SaidError } from '@ValenceI18n/SaidError';
import { saying } from '@ValenceI18n/saying';
import { SourceFailure } from './SourceFailure';

const SAID = saying('error.imports.noSuchSource');

describe('SourceFailure', () => {
  it('carries what went wrong and the status the source answered with', () => {
    const failure = new SourceFailure(SAID, 401);

    expect(failure).toBeInstanceOf(SaidError);
    expect(failure.name).toBe('SourceFailure');
    expect(failure.status).toBe(401);
  });

  it('has no status when the source never answered', () => {
    expect(new SourceFailure(SAID).status).toBeNull();
  });
});
