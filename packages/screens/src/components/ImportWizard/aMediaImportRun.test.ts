import { describe, expect, it } from 'vitest';
import { MediaImportRunSchema } from '@ValenceContracts/schemas/MediaImport';
import { A_REPORT, aMediaImportRun } from './aMediaImportRun';

describe('aMediaImportRun', () => {
  it('describes an import the way the server does', () => {
    expect(
      MediaImportRunSchema.parse(aMediaImportRun({ state: 'planned', report: A_REPORT })).state,
    ).toBe('planned');
  });
});
