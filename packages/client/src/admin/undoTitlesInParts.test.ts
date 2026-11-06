import { describe, expect, it, vi } from 'vitest';
import { undoTitlesInParts } from './undoTitlesInParts';
import type {
  BulkTitleUndoRequest,
  BulkTitleUndoOutcome,
} from '@ValenceContracts/schemas/BulkTitleEdit';

const { sending } = vi.hoisted(() => ({
  sending: vi.fn<(request: BulkTitleUndoRequest) => Promise<BulkTitleUndoOutcome>>(),
}));

vi.mock('./undoTitlesTogether', () => ({ undoTitlesTogether: sending }));

describe('undoTitlesInParts', () => {
  it('undoes a large change a part at a time, the undoing kept under one change set', async () => {
    sending.mockImplementation((request: BulkTitleUndoRequest) =>
      Promise.resolve({
        changeSetId: request.undoSetId ?? 'undo-1',
        undone: request.targets.length,
      }),
    );
    const targets = Array.from({ length: 600 }, (_, at) => ({
      mediaId: `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`,
      scope: 'title' as const,
    }));

    await expect(undoTitlesInParts('set-1', targets)).resolves.toBe(600);
    expect(sending.mock.calls.map(([request]) => request.undoSetId)).toEqual([undefined, 'undo-1']);
  });
});
