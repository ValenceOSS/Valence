import { describe, expect, it } from 'vitest';
import { nameTheStanding } from './nameTheStanding';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';

const standing = (change: Partial<CatalogueStanding>): CatalogueStanding => ({
  status: 'askable',
  mediaId: null,
  requestId: null,
  requestState: null,
  ...change,
});

describe('nameTheStanding', () => {
  it('says nothing about something that can simply be asked for', () => {
    expect(nameTheStanding(standing({}))).toBeNull();
  });

  it('says a title is in the library', () => {
    expect(nameTheStanding(standing({ status: 'library', mediaId: 'm' }))?.look).toBe('done');
  });

  it('names the linked server that has a title', () => {
    expect(
      nameTheStanding(standing({ status: 'linked', mediaId: 'm', fromServer: 'Films' })),
    ).toEqual({ look: 'done', label: 'On Films' });
  });

  it('says how a request is getting on, for a title a linked server has that is asked for here', () => {
    expect(
      nameTheStanding(
        standing({
          status: 'linked',
          mediaId: 'm',
          fromServer: 'Films',
          requestId: '00000000-0000-4000-8000-000000000001',
          requestState: 'awaitingApproval',
        }),
      )?.look,
    ).toBe('attention');
  });

  it('names a request’s state in the same words as everywhere else', () => {
    const asked = (requestState: CatalogueStanding['requestState']) =>
      nameTheStanding(
        standing({
          status: 'requested',
          requestId: '00000000-0000-4000-8000-000000000001',
          requestState,
        }),
      );

    expect(asked('failed')).toEqual({ look: 'failed', label: 'Failed' });
    expect(asked('available')).toEqual({ look: 'done', label: 'In the library' });
    expect(asked('chosen')).toEqual({ look: 'working', label: 'Downloading' });
    expect(asked('wanted')).toEqual({ look: 'attention', label: 'Missing' });
  });

  it('says a request is queued while nothing has happened to it yet', () => {
    expect(
      nameTheStanding(
        standing({ status: 'requested', requestId: '00000000-0000-4000-8000-000000000001' }),
      )?.look,
    ).toBe('queued');
  });
});
