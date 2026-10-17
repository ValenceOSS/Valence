import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RestoreBackupDialog } from './RestoreBackupDialog';

describe('RestoreBackupDialog', () => {
  it('gives the command to put the copy back, with its name', () => {
    render(
      <RestoreBackupDialog
        backup={{
          name: 'valence-2026-10-17T03-04-05-678Z-by-hand.dump',
          kind: 'byHand',
          takenAt: '2026-10-17T03:04:05.678Z',
          sizeBytes: 1024,
          before: null,
        }}
        restoreCommand="restore"
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText('restore valence-2026-10-17T03-04-05-678Z-by-hand.dump'),
    ).toBeInTheDocument();
  });
});
