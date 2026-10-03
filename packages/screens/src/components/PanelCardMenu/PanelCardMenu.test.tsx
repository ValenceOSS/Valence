import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PanelCardMenu } from './PanelCardMenu';

describe('PanelCardMenu', () => {
  it('says Actions on its trigger, named for what it acts on', () => {
    render(<PanelCardMenu label="Library actions" groups={[]} />);

    expect(screen.getByRole('button', { name: 'Library actions' })).toHaveTextContent('Actions');
  });

  it('does what is chosen from it', async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();

    render(
      <PanelCardMenu
        label="Library actions"
        groups={[{ items: [{ id: 'scan', label: 'Scan every library', onChoose }] }]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Library actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Scan every library' }));

    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PanelCardMenu.displayName).toBe('PanelCardMenu');
  });
});
