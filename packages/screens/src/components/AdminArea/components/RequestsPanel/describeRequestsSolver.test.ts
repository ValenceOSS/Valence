import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { describe, expect, it } from 'vitest';
import { NO_WORK, SOLVER_NOT_USED } from '@ValenceContracts/schemas/Requests';
import { describeRequestsSolver } from './describeRequestsSolver';
import type { RequestsOverview, RequestsSolver } from '@ValenceContracts/schemas/Requests';

/**
 * What the server heard from a service whose solver is as given.
 */
const hearing = (solver: RequestsSolver | null): RequestsOverview => ({
  address: 'http://requests:8421',
  isReachable: solver !== null,
  problem: null,
  problemCode: null,
  checkedAt: '2026-09-28T12:00:00.000Z',
  status:
    solver === null
      ? null
      : {
          version: '0.4.0',
          vpn: {
            isConfigured: false,
            isUp: null,
            publicAddress: null,
            country: null,
            checkedAt: null,
            problem: null,
            problemCode: null,
          },
          indexers: { total: 0, enabled: 0, failing: [] },
          solver,
        },
  work: NO_WORK,
});

describe('describeRequestsSolver', () => {
  it('says nothing until the service answers', () => {
    expect(describeRequestsSolver(hearing(null)).label).toBe('Not checked');
  });

  it('says nothing of a service too old to report on its solver, rather than calling it working', () => {
    const answered = hearing(SOLVER_NOT_USED);
    const status = answered.status === null ? null : { ...answered.status, solver: null };

    expect(describeRequestsSolver({ ...answered, status })).toMatchObject({
      label: 'Not checked',
      tone: 'quiet',
    });
  });

  it('calls a solver nothing has asked for yet working rather than broken', () => {
    expect(describeRequestsSolver(hearing(SOLVER_NOT_USED))).toMatchObject({
      label: 'Online',
      tone: 'success',
    });
  });

  it('says why the browser will not start', () => {
    expect(
      describeRequestsSolver(
        hearing({ ...SOLVER_NOT_USED, startProblem: sayVerbatim('No browser installed') }),
      ),
    ).toMatchObject({
      label: 'Can’t start',
      tone: 'danger',
      detail: 'It would not start: No browser installed',
    });
  });

  it('says it is failing when its last request failed', () => {
    const described = describeRequestsSolver(
      hearing({
        ...SOLVER_NOT_USED,
        passed: 3,
        failed: 1,
        lastPassedAt: '2026-09-28T11:00:00.000Z',
        lastFailedAt: '2026-09-28T11:30:00.000Z',
        problem: sayVerbatim('Timed out'),
      }),
    );

    expect(described).toMatchObject({ label: 'Offline', tone: 'danger' });
    expect(described.detail).toContain('Timed out');
  });

  it('calls an open browser working', () => {
    expect(
      describeRequestsSolver(
        hearing({
          ...SOLVER_NOT_USED,
          isRunning: true,
          sites: 1,
          runningSince: '2026-09-28T11:00:00.000Z',
          passed: 2,
          lastPassedAt: '2026-09-28T11:30:00.000Z',
        }),
      ),
    ).toEqual({ label: 'Online', tone: 'success', detail: '' });
  });

  it('calls a closed browser whose last request got through working, not down', () => {
    expect(
      describeRequestsSolver(
        hearing({ ...SOLVER_NOT_USED, passed: 1, lastPassedAt: '2026-09-28T11:30:00.000Z' }),
      ),
    ).toMatchObject({ label: 'Online', tone: 'success' });
  });
});
