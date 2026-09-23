import { describe, expect, it } from 'vitest';
import { describeRequestState } from './describeRequestState';
import type { RequestItemState } from '@ValenceContracts/schemas/MediaRequest';

const APPROVED = { approval: 'approved' as const, problem: null, problemCode: null };

/**
 * Items in the states given.
 */
const items = (...states: RequestItemState[]) =>
  states.map((state) => ({
    state,
    problem: state === 'failed' ? 'It went wrong' : null,
    problemCode: null,
  }));

describe('describeRequestState', () => {
  it('waits on approval, or says it was refused, before anything else', () => {
    expect(
      describeRequestState(
        { approval: 'awaiting', problem: null, problemCode: null },
        items('wanted'),
      ),
    ).toEqual({
      state: 'awaitingApproval',
      problem: null,
      problemCode: null,
    });
    expect(
      describeRequestState({ approval: 'refused', problem: null, problemCode: null }, []),
    ).toEqual({
      state: 'refused',
      problem: null,
      problemCode: null,
    });
  });

  it('shows what is furthest along of what is under way', () => {
    expect(
      describeRequestState(APPROVED, items('available', 'searching', 'downloading', 'wanted'))
        .state,
    ).toBe('downloading');
  });

  it('says why it failed, before anything wanted', () => {
    expect(describeRequestState(APPROVED, items('wanted', 'failed'))).toEqual({
      state: 'failed',
      problem: 'It went wrong',
      problemCode: null,
    });
  });

  it('counts a series as available while its next episodes have not aired', () => {
    expect(describeRequestState(APPROVED, items('available', 'waiting')).state).toBe('available');
    expect(describeRequestState(APPROVED, items('available', 'wanted')).state).toBe('wanted');
    expect(describeRequestState(APPROVED, items('waiting')).state).toBe('waiting');
    expect(describeRequestState(APPROVED, []).state).toBe('waiting');
  });

  it('says what went wrong with the request itself first', () => {
    expect(
      describeRequestState(
        { approval: 'approved', problem: 'No library', problemCode: null },
        items('wanted'),
      ),
    ).toEqual({ state: 'wanted', problem: 'No library', problemCode: null });
  });

  it('says what kind of problem it is, beside what went wrong', () => {
    expect(
      describeRequestState(APPROVED, [
        { state: 'filing', problem: 'May not write', problemCode: 'MayNotWriteToLibrary' },
      ]),
    ).toEqual({ state: 'filing', problem: 'May not write', problemCode: 'MayNotWriteToLibrary' });
    expect(
      describeRequestState(
        { approval: 'approved', problem: 'Refused', problemCode: 'CloudflareRefusesAddress' },
        items('wanted'),
      ).problemCode,
    ).toBe('CloudflareRefusesAddress');
  });
});
