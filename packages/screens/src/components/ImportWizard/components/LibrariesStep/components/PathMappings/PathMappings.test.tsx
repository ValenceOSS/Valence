import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PathMappings } from './PathMappings';

describe('PathMappings', () => {
  it('edits, adds and removes folder pairs, saving only the whole ones', async () => {
    const onSave = vi.fn();

    render(
      <PathMappings
        sourceName="Den"
        mappings={[{ from: '/data', to: '/media' }]}
        isSaving={false}
        onSave={onSave}
      />,
    );

    expect(screen.getByLabelText('On Den')).toHaveValue('/data');

    await userEvent.click(screen.getByRole('button', { name: 'Add a folder' }));

    const sources = screen.getAllByLabelText('On Den');
    const valence = screen.getAllByLabelText('In Valence');

    await userEvent.type(sources[1] ?? document.body, '/data/kids');
    await userEvent.clear(valence[0] ?? document.body);
    await userEvent.type(valence[0] ?? document.body, '/srv');
    await userEvent.click(screen.getByRole('button', { name: 'Save and look again' }));

    expect(onSave).toHaveBeenLastCalledWith([{ from: '/data', to: '/srv' }]);

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Remove this folder' })[0] ?? document.body,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save and look again' }));

    expect(onSave).toHaveBeenLastCalledWith([]);
  });
});
