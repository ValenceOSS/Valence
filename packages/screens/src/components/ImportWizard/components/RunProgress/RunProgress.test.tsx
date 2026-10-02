import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aMediaImportRun } from '@ValenceScreens/components/ImportWizard/aMediaImportRun';
import { RunProgress } from './RunProgress';

describe('RunProgress', () => {
  it('says which phase an import is in and how far through it', () => {
    render(
      <RunProgress
        run={aMediaImportRun({
          progress: {
            phase: {
              code: 'server.imports.progress.buildingTheCollections',
              message: 'Building the collections',
              values: {},
            },
            processed: 2,
            total: 8,
          },
        })}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Building the collections')).toBeInTheDocument();
    expect(screen.getByText('2 of 8')).toBeVisible();
  });

  it('says it is getting ready before it has said anything, and stops when asked', async () => {
    const onCancel = vi.fn();

    render(<RunProgress run={aMediaImportRun()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(screen.getByLabelText('Getting ready')).toBeInTheDocument();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
