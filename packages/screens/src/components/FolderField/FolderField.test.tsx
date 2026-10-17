import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FolderField } from './FolderField';

vi.mock('@ValenceScreens/components/AdminArea/components/FolderBrowser/FolderBrowser', () => ({
  FolderBrowser: ({ onChoose }: { onChoose: (folder: string) => void }) => (
    <button
      type="button"
      onClick={() => {
        onChoose('/media/films');
      }}
    >
      Pick films
    </button>
  ),
}));

describe('FolderField', () => {
  it('fills the path with the folder chosen by browsing', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(<FolderField label="Path" value="" onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: /Browse/ }));
    await user.click(screen.getByRole('button', { name: 'Pick films' }));

    expect(onValueChange).toHaveBeenCalledWith('/media/films');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FolderField.displayName).toBe('FolderField');
  });
});
