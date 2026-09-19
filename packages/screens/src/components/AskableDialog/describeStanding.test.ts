import { describe, expect, it } from 'vitest';
import { describeStanding } from './describeStanding';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * A standing of the status and request state given.
 */
const standing = (
  status: CatalogueStanding['status'],
  requestState: CatalogueStanding['requestState'] = null,
): CatalogueStanding => ({ status, mediaId: null, requestId: null, requestState });

describe('describeStanding', () => {
  it('says a title is in the library, or nothing where it is there to ask for', () => {
    expect(describeStanding(standing('library'))).toEqual({
      label: 'In your library',
      tone: 'success',
    });
    expect(describeStanding(standing('askable'))).toBeNull();
  });

  it('says how far a request has got', () => {
    expect(describeStanding(standing('requested', 'awaitingApproval'))?.label).toBe(
      'Waiting for approval',
    );
    expect(describeStanding(standing('requested', 'downloading'))?.tone).toBe('busy');
    expect(describeStanding(standing('requested', 'filed'))?.label).toBe('Arriving');
    expect(describeStanding(standing('requested', 'failed'))?.label).toBe('Stuck');
    expect(describeStanding(standing('requested', 'wanted'))?.label).toBe('Requested');
    expect(describeStanding(standing('requested', 'refused'))?.label).toBe('Refused');
  });
});
