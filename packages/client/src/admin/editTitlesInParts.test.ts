import { describe, expect, it, vi } from 'vitest';
import { editTitlesInParts } from './editTitlesInParts';
import type {
  BulkTitleEditRequest,
  BulkTitleEditOutcome,
} from '@ValenceContracts/schemas/BulkTitleEdit';

const { sending } = vi.hoisted(() => ({
  sending: vi.fn<(request: BulkTitleEditRequest) => Promise<BulkTitleEditOutcome>>(),
}));

vi.mock('./editTitlesTogether', () => ({ editTitlesTogether: sending }));

const targetsOf = (count: number) =>
  Array.from({ length: count }, (_, at) => ({
    mediaId: `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`,
    scope: 'title' as const,
  }));

describe('editTitlesInParts', () => {
  it('sends a large choice a part at a time, every part under the first part’s change set', async () => {
    sending.mockImplementation((request: BulkTitleEditRequest) =>
      Promise.resolve({
        changeSetId: request.changeSetId ?? 'set-1',
        changed: request.targets,
        unchanged: 0,
        refused: 0,
      }),
    );
    const onProgress = vi.fn();

    const outcome = await editTitlesInParts(
      targetsOf(1200),
      { lockAll: true },
      'titles',
      onProgress,
    );

    expect(sending).toHaveBeenCalledTimes(3);
    expect(sending.mock.calls.map(([request]) => request.changeSetId)).toEqual([
      undefined,
      'set-1',
      'set-1',
    ]);
    expect(outcome.changed).toHaveLength(1200);
    expect(onProgress).toHaveBeenLastCalledWith(1200);
  });
});
